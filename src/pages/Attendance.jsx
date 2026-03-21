import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, MapPin, Map as MapIcon, RotateCcw, Check, Navigation, AlertCircle, Loader2, Sparkles, Navigation2 } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Polyline, Marker, InfoWindow, OverlayView } from '@react-google-maps/api';
import * as api from '../store/api';
import './Attendance.css';

const containerStyle = {
  width: '100%',
  height: '100%'
};

function AdminAttendance() {
    const [period, setPeriod] = useState('1d');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: "" });
    const [map, setMap] = useState(null);
    const [activeMarker, setActiveMarker] = useState(null);

    const onLoadMap = useCallback(m => setMap(m), []);
    const onUnmountMap = useCallback(m => setMap(null), []);

    const colors = ['#22c55e', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    const employeeColorMap = {};
    let colorIndex = 0;
    records.forEach(r => {
        if (!employeeColorMap[r.employeeName]) {
            employeeColorMap[r.employeeName] = colors[colorIndex % colors.length];
            colorIndex++;
        }
    });

    useEffect(() => { loadData(); }, [period]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await api.fetchAttendanceSummary(period === 'all' ? '' : period);
            setRecords(data || []);
        } catch (error) {
            console.error('Failed to load tracking summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const [isSimulating, setIsSimulating] = useState(false);
    const handleSimulateAll = async () => {
        setIsSimulating(true);
        try {
            await api.simulateAdminAttendance();
            await loadData();
        } catch (error) {
            console.error('Failed to simulate fleet data:', error);
        } finally {
            setIsSimulating(false);
        }
    };

    return (
        <div className="attendance-page" style={{ padding: '2rem' }}>
            <header className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Employee Tracking Summary</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button 
                        className="btn outline sm text-purple" 
                        onClick={handleSimulateAll}
                        disabled={isSimulating}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {isSimulating ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                        {isSimulating ? 'Generating...' : 'Load Fleet Demo Data'}
                    </button>
                    <span style={{color: '#9ca3af', fontSize: '0.875rem', marginLeft: '1rem'}}>Filter Period:</span>
                    <select 
                        style={{ padding: '0.5rem', borderRadius: '4px', background: '#1f2937', color: 'white', border: '1px solid #374151' }}
                        value={period} 
                        onChange={e => setPeriod(e.target.value)}
                    >
                        <option value="1d">Last 1 Day</option>
                        <option value="3d">Last 3 Days</option>
                        <option value="1w">Last 1 Week</option>
                        <option value="1m">Last 1 Month</option>
                        <option value="all">All Time</option>
                    </select>
                </div>
            </header>

            <div className="card" style={{ overflowX: 'auto', background: '#111827', border: '1px solid #1f2937' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #374151', color: '#9ca3af', fontSize: '0.875rem' }}>
                            <th style={{ padding: '1rem' }}>S.No</th>
                            <th style={{ padding: '1rem' }}>Employee</th>
                            <th style={{ padding: '1rem' }}>Date</th>
                            <th style={{ padding: '1rem' }}>Check In</th>
                            <th style={{ padding: '1rem' }}>Check Out</th>
                            <th style={{ padding: '1rem' }}>Customers/Company Visited</th>
                            <th style={{ padding: '1rem' }}>Distance Travelled</th>
                            <th style={{ padding: '1rem' }}>Wait Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}><Loader2 size={24} className="spin" style={{margin: '0 auto'}} /></td></tr>
                        ) : records.length === 0 ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No tracking data found for this period.</td></tr>
                        ) : (
                            records.map((r, i) => (
                                <tr key={r.id || i} style={{ borderBottom: '1px solid #1f2937', fontSize: '0.875rem' }}>
                                    <td style={{ padding: '1rem', color: '#9ca3af' }}>{i + 1}</td>
                                    <td style={{ padding: '1rem', fontWeight: '600', color: 'white' }}>{r.employeeName}</td>
                                    <td style={{ padding: '1rem', color: '#d1d5db' }}>{new Date(r.date).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem', color: '#10b981' }}>{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                                    <td style={{ padding: '1rem', color: '#ef4444' }}>{r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                                    <td style={{ padding: '1rem', color: '#d1d5db' }}>{r.companiesVisited || '-'}</td>
                                    <td style={{ padding: '1rem', color: '#818cf8', fontWeight: '500' }}>{r.totalDistanceKm} km</td>
                                    <td style={{ padding: '1rem', color: '#fb923c', fontWeight: '500' }}>{r.totalWaitTimeMinutes} min</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isLoaded && records.filter(r => r.routePoints && r.routePoints.length > 0).length > 0 && (
                <div className="card" style={{ marginTop: '2rem', padding: '1rem', background: '#111827', border: '1px solid #1f2937' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        {Object.entries(employeeColorMap).map(([name, color]) => (
                            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color }}></div>
                                <span style={{ color: '#d1d5db', fontSize: '0.875rem' }}>{name}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ height: '600px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
                        <GoogleMap 
                            mapContainerStyle={containerStyle} 
                            zoom={12} 
                            center={{ lat: 17.4399, lng: 78.4983 }}
                            onLoad={onLoadMap}
                            onUnmount={onUnmountMap}
                        >
                            {records.map(r => {
                                if (!r.routePoints || r.routePoints.length === 0) return null;
                                const path = r.routePoints.map(p => ({ lat: p.lat, lng: p.lng }));
                                const lastPoint = r.routePoints[r.routePoints.length - 1];
                                const employeeColor = employeeColorMap[r.employeeName];

                                return (
                                    <div key={r.id}>
                                        <Polyline
                                            path={path}
                                            options={{ strokeColor: employeeColor, strokeOpacity: 0.8, strokeWeight: 4 }}
                                        />
                                        
                                        {/* Render Red Dots for stops */}
                                        {r.routePoints.map((p, pIdx) => (
                                            p.isWaitPoint && (
                                                <div key={`stop=${pIdx}`}>
                                                    <Marker
                                                        position={{ lat: p.lat, lng: p.lng }}
                                                        icon={{
                                                            path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                                                            fillColor: '#ef4444', // Red for stops
                                                            fillOpacity: 1,
                                                            strokeWeight: 2,
                                                            strokeColor: '#ffffff',
                                                            scale: 7
                                                        }}
                                                        onClick={() => setActiveMarker(`${r.id}-stop-${pIdx}`)}
                                                    />
                                                    {activeMarker === `${r.id}-stop-${pIdx}` && (
                                                        <InfoWindow 
                                                            position={{ lat: p.lat, lng: p.lng }} 
                                                            onCloseClick={() => setActiveMarker(null)}
                                                        >
                                                            <div className="info-window-card">
                                                                <div className="info-profile">
                                                                    <div>
                                                                        <strong>{r.employeeName}</strong>
                                                                        <p>Stop Activity</p>
                                                                    </div>
                                                                </div>
                                                                <hr/>
                                                                <div className="info-details">
                                                                    {p.companyName && <p><strong>Company:</strong> {p.companyName}</p>}
                                                                    <p><strong>Location:</strong> {p.placeName || "Meeting / Stop"}</p>
                                                                    <p><strong>Wait Time:</strong> {p.waitTimeMinutes} min</p>
                                                                </div>
                                                            </div>
                                                        </InfoWindow>
                                                    )}
                                                </div>
                                            )
                                        ))}

                                        <OverlayView
                                            position={{ lat: lastPoint.lat, lng: lastPoint.lng }}
                                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                                            getPixelPositionOffset={(width, height) => ({ x: -(width / 2), y: -(height / 2) })}
                                        >
                                            <div 
                                                className="map-avatar-marker start-marker"
                                                style={{ 
                                                    backgroundImage: `url(${r.employeeAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop'})`,
                                                    border: `3px solid ${employeeColor}`
                                                }}
                                                onClick={() => setActiveMarker(r.id)}
                                            />
                                        </OverlayView>

                                        {/* Avatar click summary */}
                                        {activeMarker === r.id && (
                                            <InfoWindow 
                                                position={{ lat: lastPoint.lat, lng: lastPoint.lng }} 
                                                onCloseClick={() => setActiveMarker(null)}
                                            >
                                                <div className="info-window-card">
                                                    <div className="info-profile">
                                                        <div>
                                                            <strong>{r.employeeName}</strong>
                                                            <p>Current Status</p>
                                                        </div>
                                                    </div>
                                                    <hr/>
                                                    <div className="info-details">
                                                        <p><strong>Distance:</strong> {r.totalDistanceKm} km</p>
                                                        <p><strong>Wait:</strong> {r.totalWaitTimeMinutes} min</p>
                                                        <p><strong>Stops:</strong> {r.companiesVisited.split(', ').filter(Boolean).length}</p>
                                                    </div>
                                                </div>
                                            </InfoWindow>
                                        )}
                                    </div>
                                );
                            })}
                        </GoogleMap>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Attendance() {
    const { user } = useAuth();

    if (user?.role === 'Admin') {
        return <AdminAttendance />;
    }
    const [status, setStatus] = useState('loading');
    const [attendanceData, setAttendanceData] = useState(null);
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    
    // Google Maps Loading
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "" // Empty or restricted key normally goes here. Without a key, it works in 'development' mode which is fine for previews!
    });
    
    const [map, setMap] = useState(null);
    const [activeMarker, setActiveMarker] = useState(null);
    const [showRoute, setShowRoute] = useState(false);
    const [showDemoConfirm, setShowDemoConfirm] = useState(false);

    // Camera state
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [photo, setPhoto] = useState(null);
    const [isCameraActive, setIsCameraActive] = useState(false);

    useEffect(() => {
        loadTodayAttendance();
        return () => stopCamera();
    }, []);

    const loadTodayAttendance = async () => {
        try {
            const result = await api.request(`/attendance/today`);
            setAttendanceData(result || null);
        } catch (error) {
            console.error('Failed to load attendance:', error);
        } finally {
            setStatus('active');
        }
    };

    const simulateData = async () => {
        setShowDemoConfirm(false);
        setStatus('submitting');
        try {
            const res = await api.request('/attendance/simulate', { method: 'POST' });
            setAttendanceData(res.record);
            setShowRoute(false);
        } catch (error) {
            console.error('Failed to simulate:', error.message);
        } finally {
            setStatus('active');
        }
    };

    const requestLocation = () => {
        setLocationError(null);
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => setLocation({ lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy }),
            (error) => setLocationError("Location error: " + error.message),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.setAttribute('playsinline', true); 
                videoRef.current.play();
            }
            setIsCameraActive(true);
            setPhoto(null);
        } catch (error) {
            alert("Could not access camera. Please check permissions.");
        }
    };

    const stopCamera = () => {
        if (stream) { stream.getTracks().forEach(track => track.stop()); setStream(null); }
        setIsCameraActive(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            setPhoto(canvas.toDataURL('image/jpeg', 0.8));
            stopCamera();
        }
    };

    const handleSubmit = async (type) => { 
        if (!location || !photo) { return alert('Location and Selfie are required.'); }
        setStatus('submitting');
        try {
            const route = type === 'checkIn' ? '/attendance/checkin' : '/attendance/checkout';
            const res = await api.request(route, { method: 'POST', body: { lat: location.lat, lng: location.lng, photoDataUrl: photo } });
            setAttendanceData(res);
            setPhoto(null);
            setLocation(null);
        } catch (error) {
            alert('Failed to submit attendance: ' + error.message);
        } finally {
            setStatus('active');
        }
    };

    const onLoadMap = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmountMap = useCallback(function callback(map) {
        setMap(null);
    }, []);

    const hasCheckedIn = attendanceData?.checkIn?.timestamp;
    const hasCheckedOut = attendanceData?.checkOut?.timestamp;

    // Define center 
    let mapCenter = { lat: 17.4399, lng: 78.4983 }; // Hyderabad default
    if (location) mapCenter = location;
    else if (attendanceData?.routePoints?.length > 0) mapCenter = attendanceData.routePoints[0];

    const polylinePath = attendanceData?.routePoints?.map(p => ({ lat: p.lat, lng: p.lng })) || [];
    
    // Extract unique wait/stop markers
    const waitMarkers = attendanceData?.routePoints?.filter(p => p.isWaitPoint) || [];

    if (status === 'loading') return <div className="attendance-page center"><Loader2 size={32} className="spin text-blue" /></div>;

    return (
        <div className="attendance-page">
            <header className="page-header">
                <h2>Daily Tracking & Reports</h2>
                <div className="header-actions">
                    {!showDemoConfirm ? (
                        <button id="demo-track-btn" className="btn outline sm text-purple" onClick={() => setShowDemoConfirm(true)}>
                            <Sparkles size={16}/> Demo Auto-Track Route
                        </button>
                    ) : (
                        <div className="demo-confirm-row">
                            <span className="demo-confirm-text">Overwrite today's data with simulated Hyderabad route?</span>
                            <button id="demo-confirm-yes" className="btn primary sm" onClick={simulateData}>Yes, Load Demo</button>
                            <button id="demo-confirm-no" className="btn outline sm" onClick={() => setShowDemoConfirm(false)}>Cancel</button>
                        </div>
                    )}
                    <span className="attendance-date ml-3">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </header>

            <div className="attendance-grid">
                
                {/* Status Card */}
                <div className="card status-card">
                    <h3>Your Status Today</h3>
                    <div className="status-timeline">
                        <div className={`timeline-tick ${hasCheckedIn ? 'active' : ''}`}>
                            <div className="tick-circle">✓</div>
                            <div className="tick-content">
                                <strong>Check In</strong>
                                {hasCheckedIn ? <span className="time-text">{new Date(attendanceData.checkIn.timestamp).toLocaleTimeString()}</span> : <span className="time-text pending">Pending</span>}
                            </div>
                        </div>
                        <div className={`timeline-tick ${hasCheckedOut ? 'active' : ''}`}>
                            <div className="tick-circle">✓</div>
                            <div className="tick-content">
                                <strong>Check Out</strong>
                                {hasCheckedOut ? <span className="time-text">{new Date(attendanceData.checkOut.timestamp).toLocaleTimeString()}</span> : <span className="time-text pending">Pending</span>}
                            </div>
                        </div>
                    </div>

                    {attendanceData?.summary && (
                         <div className="daily-summary">
                             <div className="summary-stat">
                                 <span className="stat-label">Total Distance</span>
                                 <span className="stat-value text-indigo">{attendanceData.summary.totalDistanceKm || 0} km</span>
                             </div>
                             <div className="summary-stat">
                                 <span className="stat-label">Total Wait Time</span>
                                 <span className="stat-value text-orange">{attendanceData.summary.totalWaitTimeMinutes || 0} min</span>
                             </div>
                             <div className="summary-stat mt-2">
                                 <span className="stat-label">Locations Stopped</span>
                                 <span className="stat-value">{waitMarkers.length} Places</span>
                             </div>
                         </div>
                    )}
                </div>

                {/* Action Area */}
                {!hasCheckedOut && (
                    <div className="card action-card">
                        <h3>{hasCheckedIn ? 'Record Check Out' : 'Record Check In'}</h3>
                        <div className="action-steps">
                            <div className={`action-step ${location ? 'completed' : ''}`}>
                                <div className="step-header">
                                    <span className="step-number">1</span>
                                    <h4>Get Current Location</h4>
                                </div>
                                <div className="step-body">
                                    {location ? (
                                        <div className="location-success">
                                            <MapPin size={18} className="text-green" />
                                            <span>Accuracy: {Math.round(location.accuracy)}m</span>
                                            <button className="btn-icon small outline ml-auto" onClick={requestLocation}><RotateCcw size={14}/></button>
                                        </div>
                                    ) : (
                                        <button className="btn outline" onClick={requestLocation}><Navigation size={18} /> Detect Location</button>
                                    )}
                                </div>
                            </div>

                            <div className={`action-step ${photo ? 'completed' : ''}`}>
                                <div className="step-header">
                                    <span className="step-number">2</span>
                                    <h4>Take a Selfie</h4>
                                </div>
                                <div className="step-body">
                                    {!isCameraActive && !photo && <button className="btn outline" onClick={startCamera}><Camera size={18} /> Open Camera</button>}
                                    {isCameraActive && (
                                        <div className="camera-container">
                                            <video ref={videoRef} className="camera-video" autoPlay playsInline muted />
                                            <button className="btn primary capture-btn" onClick={capturePhoto}><Camera size={18} /> Capture</button>
                                        </div>
                                    )}
                                    {photo && (
                                        <div className="photo-preview-container">
                                            <img src={photo} alt="Selfie preview" className="photo-preview" />
                                            <button className="btn outline retake-btn" onClick={() => { setPhoto(null); startCamera(); }}><RotateCcw size={16} /> Retake</button>
                                        </div>
                                    )}
                                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                                </div>
                            </div>
                            
                            <div className="submit-section">
                                <button className={`btn primary lg full-width ${(!location || !photo || status === 'submitting') ? 'disabled' : ''}`} disabled={!location || !photo || status === 'submitting'} onClick={() => handleSubmit(hasCheckedIn ? 'checkOut' : 'checkIn')}>
                                    {status === 'submitting' ? <><Loader2 size={20} className="spin"/> Processing...</> : <><Check size={20}/> Submit {hasCheckedIn ? 'Check Out' : 'Check In'}</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Map View - Google Maps */}
                <div className="card map-card full-width-mobile">
                    <div className="card-header pb-0">
                        <h3><MapIcon size={20}/> Employee Tracker Map</h3>
                    </div>
                    <div className="map-container mt-2">
                        {isLoaded ? (
                            <GoogleMap
                                mapContainerStyle={containerStyle}
                                center={mapCenter}
                                zoom={14}
                                onLoad={onLoadMap}
                                onUnmount={onUnmountMap}
                                options={{
                                    mapTypeControl: false,
                                    streetViewControl: false,
                                    clickableIcons: false,
                                    scrollwheel: true
                                }}
                            >
                                {/* Current user location if tracking */}
                                {location && !hasCheckedOut && (
                                    <Marker position={{ lat: location.lat, lng: location.lng }} />
                                )}

                                {/* Polyline route (Travel path) - ONLY SHOW IF AVATAR CLICKED */}
                                {polylinePath.length > 0 && showRoute && (
                                    <Polyline
                                        path={polylinePath}
                                        options={{ strokeColor: '#22c55e', strokeOpacity: 0.8, strokeWeight: 5 }}
                                    />
                                )}

                                {/* Specific Wait/Stop Points representing Client Meetings or Stops (Red markers) */}
                                {showRoute && waitMarkers.map((marker, idx) => (
                                    <div key={`wait-container-${idx}`}>
                                        <Marker 
                                            position={{ lat: marker.lat, lng: marker.lng }}
                                            onClick={() => setActiveMarker(`wait-${idx}`)}
                                            icon={{
                                                url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                                            }}
                                        />
                                        {activeMarker === `wait-${idx}` && (
                                            <InfoWindow 
                                                position={{ lat: marker.lat, lng: marker.lng }} 
                                                onCloseClick={() => setActiveMarker(null)}
                                            >
                                                <div className="info-window-card">
                                                    <div className="info-profile">
                                                        <div>
                                                            <strong>{user?.name}</strong>
                                                            <p>Stop {idx+1}</p>
                                                        </div>
                                                    </div>
                                                    <hr/>
                                                    <div className="info-details">
                                                        {marker.companyName && <p><MapPin size={12}/> <strong>Company:</strong> {marker.companyName}</p>}
                                                        <p><MapPin size={12}/> <strong>Location:</strong> {marker.placeName || "Meeting / Stop"}</p>
                                                        <p><Navigation2 size={12}/> <strong>Wait Time:</strong> {marker.waitTimeMinutes} min</p>
                                                    </div>
                                                </div>
                                            </InfoWindow>
                                        )}
                                    </div>
                                ))}

                                {/* Employee Avatar at Latest Position */}
                                {attendanceData?.routePoints?.length > 0 && (
                                    <div key="employee-avatar">
                                        <OverlayView
                                            position={{ 
                                                lat: attendanceData.routePoints[attendanceData.routePoints.length - 1].lat, 
                                                lng: attendanceData.routePoints[attendanceData.routePoints.length - 1].lng 
                                            }}
                                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                                            getPixelPositionOffset={(width, height) => ({ x: -(width / 2), y: -(height / 2) })}
                                        >
                                            <div 
                                                className="map-avatar-marker start-marker"
                                                style={{ 
                                                    backgroundImage: `url(${attendanceData.checkIn?.selfieUrl || "/api/placeholder/40/40"})`
                                                }}
                                                onClick={() => {
                                                    setShowRoute(!showRoute);
                                                    setActiveMarker('employee');
                                                }}
                                            />
                                        </OverlayView>

                                         {activeMarker === 'employee' && (
                                            <InfoWindow 
                                                position={{ 
                                                    lat: attendanceData.routePoints[attendanceData.routePoints.length - 1].lat, 
                                                    lng: attendanceData.routePoints[attendanceData.routePoints.length - 1].lng 
                                                }}
                                                onCloseClick={() => setActiveMarker(null)}
                                            >
                                                <div className="info-window-card">
                                                    <div className="info-profile">
                                                        <div className="info-avatar">
                                                            <img src={attendanceData.checkIn?.selfieUrl || "/api/placeholder/40/40"} alt="Employee avatar" />
                                                        </div>
                                                        <div>
                                                            <strong>{user?.name}</strong>
                                                            <p>Current Status</p>
                                                        </div>
                                                    </div>
                                                    <hr/>
                                                    <div className="info-details overall-report">
                                                        <p><strong>Total KM:</strong> {attendanceData.summary.totalDistanceKm} km</p>
                                                        <p><strong>Total Stops:</strong> {waitMarkers.length}</p>
                                                        <p><strong>Total Wait:</strong> {attendanceData.summary.totalWaitTimeMinutes} min</p>
                                                    </div>
                                                </div>
                                            </InfoWindow>
                                        )}
                                    </div>
                                )}
                                
                            </GoogleMap>
                        ) : (
                            <div className="center"><Loader2 size={32} className="spin text-blue" /></div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
