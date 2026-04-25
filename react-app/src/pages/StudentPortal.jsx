import { useState, useEffect } from 'react';
import { ShieldAlert, ArrowLeft, PenSquare, Search, Star, MessageSquare, Trash2, Wind, Lightbulb, MapPin, Send, CheckCircle, Clock, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { submitReport, getReports, submitRating, getRatings, getPortalStats } from '../api';

export default function StudentPortal() {
    const [activeTab, setActiveTab] = useState('report');

    // Report form state
    const [problemType, setProblemType] = useState('');
    const [location, setLocation] = useState('');
    const [details, setDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Track complaints state
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(true);

    // Rating state
    const [ratingLocation, setRatingLocation] = useState('');
    const [ratingValue, setRatingValue] = useState(0);
    const [ratingHover, setRatingHover] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [ratingSuccess, setRatingSuccess] = useState(false);
    const [ratings, setRatings] = useState([]);
    const [loadingRatings, setLoadingRatings] = useState(true);

    // Portal stats
    const [portalStats, setPortalStats] = useState({ totalReports: 0, pendingReports: 0, resolvedReports: 0, ratingsByLocation: [] });

    // Load data when tabs change
    useEffect(() => {
        if (activeTab === 'track') {
            setLoadingReports(true);
            getReports().then(data => { setReports(data); setLoadingReports(false); });
            getPortalStats().then(setPortalStats);
        }
        if (activeTab === 'rate') {
            setLoadingRatings(true);
            getRatings().then(data => { setRatings(data); setLoadingRatings(false); });
            getPortalStats().then(setPortalStats);
        }
    }, [activeTab]);

    // Handle report submission
    const handleSubmitReport = async () => {
        if (!problemType) { setSubmitError('Please select a problem type'); return; }
        if (!location) { setSubmitError('Please select a location'); return; }
        setSubmitError('');
        setSubmitting(true);
        try {
            await submitReport({ problemType, location, details });
            setSubmitSuccess(true);
            setProblemType('');
            setLocation('');
            setDetails('');
            setTimeout(() => setSubmitSuccess(false), 4000);
        } catch (err) {
            setSubmitError('Failed to submit report. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle rating submission
    const handleSubmitRating = async () => {
        if (!ratingLocation || !ratingValue) return;
        setRatingSubmitting(true);
        try {
            await submitRating({ location: ratingLocation, rating: ratingValue, comment: ratingComment });
            setRatingSuccess(true);
            setRatingLocation('');
            setRatingValue(0);
            setRatingComment('');
            // Refresh ratings list
            const updatedRatings = await getRatings();
            setRatings(updatedRatings);
            setTimeout(() => setRatingSuccess(false), 4000);
        } catch (err) {
            console.error('Rating submission failed', err);
        } finally {
            setRatingSubmitting(false);
        }
    };

    const problemTypes = [
        { key: 'overflowing', label: 'Overflowing', icon: <Trash2 size={16} className="text-rose-500" /> },
        { key: 'bad_smell', label: 'Bad Smell', icon: <Wind size={16} className="text-amber-500" /> },
        { key: 'damaged', label: 'Damaged Bin', icon: <AlertCircle size={16} className="text-orange-500" /> },
        { key: 'other', label: 'Other', icon: <MessageSquare size={16} className="text-slate-500" /> },
    ];

    const locations = [
        { value: 'library', label: 'Library Area' },
        { value: 'cafeteria', label: 'Cafeteria' },
        { value: 'computing_labs', label: 'Computing Labs' },
        { value: 'main_block', label: 'Main Block' },
        { value: 'parking', label: 'Parking Area' },
    ];

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-100"><Clock size={12} /> Pending</span>;
            case 'IN_PROGRESS':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-50 text-sky-600 border border-sky-100"><Loader2 size={12} className="animate-spin" /> In Progress</span>;
            case 'RESOLVED':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100"><CheckCircle size={12} /> Resolved</span>;
            default:
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-50 text-slate-500 border border-slate-100">{status}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500/20 selection:text-emerald-900">

            {/* Topbar */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 px-6 md:px-10 flex flex-col md:flex-row md:items-center justify-between sticky top-0 z-[200] gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <span className="text-white font-bold text-xl">S</span>
                    </div>
                    <div>
                        <div className="font-bold text-lg tracking-tight text-slate-900">Student Portal</div>
                        <div className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase">SLIIT Campus Feedback</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-rose-50 text-rose-600 border border-rose-100 px-4 py-2 rounded-xl text-sm font-bold shadow-inner hover:bg-rose-100 transition-colors">
                        <ShieldAlert size={16} /> Emergency
                    </button>
                    <Link to="/" className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
                        <ArrowLeft size={16} /> Exit
                    </Link>
                </div>
            </div>

            {/* Emergency Banner */}
            <div className="bg-gradient-to-r from-rose-50 to-orange-50 border-b border-rose-100 px-6 md:px-10 py-3 flex items-center gap-4 shadow-[inset_0_-1px_0_rgba(255,255,255,0.5)]">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center shrink-0">
                    <ShieldAlert size={16} strokeWidth={2.5} />
                </div>
                <div className="flex-1 text-sm font-medium text-slate-700">
                    <strong className="font-bold text-rose-700 block md:inline">See a serious hazard?</strong> Use the emergency button above to alert facilities immediately.
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-[1000px] mx-auto pt-8 px-6 pb-20 animate-in fade-in duration-500">

                {/* Tab Navigation */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                    <button onClick={() => setActiveTab('report')} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'report' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-900 hover:border-slate-300'}`}>
                        <PenSquare size={16} /> Report Issue
                    </button>
                    <button onClick={() => setActiveTab('track')} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'track' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-900 hover:border-slate-300'}`}>
                        <Search size={16} /> Track Complaints
                    </button>
                    <button onClick={() => setActiveTab('rate')} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'rate' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-900 hover:border-slate-300'}`}>
                        <Star size={16} /> Rate Cleanliness
                    </button>
                </div>

                {/* ==================== REPORT TAB ==================== */}
                {activeTab === 'report' && (
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-6">

                        {/* Form Card */}
                        <div className="bg-white rounded-3xl shadow-[0_2px_20px_-3px_rgba(6,81,237,0.08)] border border-slate-100 overflow-hidden">
                            <div className="p-6 md:p-8">
                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Report a Problem</h2>
                                <p className="text-slate-500 text-sm mb-8">Takes less than 30 seconds. Your report directly helps keep our campus clean.</p>

                                {submitSuccess && (
                                    <div className="mb-6 flex items-center gap-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl p-4 animate-in fade-in duration-300">
                                        <CheckCircle size={20} />
                                        <div>
                                            <div className="font-bold text-sm">Report Submitted Successfully!</div>
                                            <div className="text-xs text-emerald-600 mt-0.5">Track it under the "Track Complaints" tab.</div>
                                        </div>
                                    </div>
                                )}

                                {submitError && (
                                    <div className="mb-6 flex items-center gap-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl p-4">
                                        <AlertCircle size={20} />
                                        <span className="text-sm font-semibold">{submitError}</span>
                                    </div>
                                )}

                                <div className="space-y-8">
                                    {/* Issue Tags */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-3">1. Select Problem Type <span className="text-rose-500">*</span></label>
                                        <div className="flex gap-2 flex-wrap">
                                            {problemTypes.map(pt => (
                                                <button
                                                    key={pt.key}
                                                    onClick={() => setProblemType(pt.key)}
                                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm cursor-pointer transition-all shadow-sm ${problemType === pt.key
                                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold ring-4 ring-emerald-500/10'
                                                        : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {pt.icon} {pt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Location Dropdown */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-3">2. Location <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <select
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 text-slate-900 rounded-xl pl-12 pr-4 py-3.5 text-sm font-semibold outline-none cursor-pointer focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none"
                                            >
                                                <option value="">-- Choose where on campus --</option>
                                                {locations.map(loc => (
                                                    <option key={loc.value} value={loc.value}>{loc.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Textarea */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-3">3. Extra Details</label>
                                        <textarea
                                            value={details}
                                            onChange={(e) => setDetails(e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-100 text-slate-900 rounded-xl px-4 py-4 text-sm font-medium outline-none min-h-[120px] resize-y focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                            placeholder="Add any specific details here..."
                                        ></textarea>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleSubmitReport}
                                        disabled={submitting}
                                        className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-8 py-4 rounded-xl text-base font-bold cursor-pointer w-full hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? (<><Loader2 size={18} className="animate-spin" /> Submitting...</>) : (<>Submit Report <Send size={18} /></>)}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Cards */}
                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-emerald-500 to-sky-500 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                                <div className="absolute top-0 right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                                <Lightbulb className="mb-4 text-white/90" size={32} />
                                <h3 className="text-xl font-bold tracking-tight mb-2">Did you know?</h3>
                                <p className="text-emerald-50 text-sm font-medium leading-relaxed mb-4">
                                    By using SmartBins and reporting overflow, you help reduce campus carbon emissions by optimizing our collection routes!
                                </p>
                            </div>

                            <div className="bg-white rounded-3xl shadow-[0_2px_20px_-3px_rgba(6,81,237,0.08)] border border-slate-100 p-6">
                                <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-4 flex items-center gap-2">
                                    <Star size={16} className="text-amber-500 fill-amber-500" /> Quick Tips
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 text-sm text-slate-600">
                                        <ChevronRight size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                        <span>Select the <strong>exact location</strong> for faster response.</span>
                                    </div>
                                    <div className="flex items-start gap-3 text-sm text-slate-600">
                                        <ChevronRight size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                        <span>Add details like <strong>"3rd floor corridor"</strong> for precision.</span>
                                    </div>
                                    <div className="flex items-start gap-3 text-sm text-slate-600">
                                        <ChevronRight size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                        <span>Track your report status in the <strong>"Track Complaints"</strong> tab.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ==================== TRACK TAB ==================== */}
                {activeTab === 'track' && (
                    <div className="space-y-6">
                        {/* Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500"></div>
                                <div className="pl-3">
                                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Pending</h3>
                                    <div className="text-3xl font-black text-slate-900">{portalStats.pendingReports}</div>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
                                <div className="pl-3">
                                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Resolved</h3>
                                    <div className="text-3xl font-black text-slate-900">{portalStats.resolvedReports}</div>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500"></div>
                                <div className="pl-3">
                                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Reports</h3>
                                    <div className="text-3xl font-black text-slate-900">{portalStats.totalReports}</div>
                                </div>
                            </div>
                        </div>

                        {/* Reports Table */}
                        <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-sm font-bold text-slate-800 tracking-tight">All Submitted Reports</h2>
                                <p className="text-[11px] text-slate-500 mt-0.5">Most recent first</p>
                            </div>
                            <div className="overflow-x-auto">
                                {loadingReports ? (
                                    <div className="flex items-center justify-center py-16 text-slate-400">
                                        <Loader2 size={24} className="animate-spin mr-3" /> Loading reports...
                                    </div>
                                ) : reports.length === 0 ? (
                                    <div className="text-center py-16 text-slate-400 text-sm italic">
                                        No reports submitted yet. Be the first to report an issue!
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse whitespace-nowrap">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-white">
                                                <th className="p-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Date</th>
                                                <th className="p-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Type</th>
                                                <th className="p-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Location</th>
                                                <th className="p-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Details</th>
                                                <th className="p-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reports.map((report) => (
                                                <tr key={report.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 text-sm font-medium text-slate-600">
                                                        {new Date(report.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                                                        <div className="text-[10px] text-slate-400">{new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-100 capitalize">
                                                            {report.problemType?.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm font-semibold text-slate-700 capitalize">{report.location?.replace('_', ' ')}</td>
                                                    <td className="p-4 text-sm text-slate-500 max-w-[200px] truncate">{report.details || '—'}</td>
                                                    <td className="p-4">{getStatusBadge(report.status)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ==================== RATE TAB ==================== */}
                {activeTab === 'rate' && (
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-6">

                        {/* Rating Form */}
                        <div className="bg-white rounded-3xl shadow-[0_2px_20px_-3px_rgba(6,81,237,0.08)] border border-slate-100 overflow-hidden">
                            <div className="p-6 md:p-8">
                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Rate Campus Cleanliness</h2>
                                <p className="text-slate-500 text-sm mb-8">Help us improve by rating the cleanliness of different campus areas.</p>

                                {ratingSuccess && (
                                    <div className="mb-6 flex items-center gap-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl p-4 animate-in fade-in duration-300">
                                        <CheckCircle size={20} />
                                        <span className="font-bold text-sm">Thank you for your feedback!</span>
                                    </div>
                                )}

                                <div className="space-y-8">
                                    {/* Location */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-3">1. Select Area <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <select
                                                value={ratingLocation}
                                                onChange={(e) => setRatingLocation(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 text-slate-900 rounded-xl pl-12 pr-4 py-3.5 text-sm font-semibold outline-none cursor-pointer focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none"
                                            >
                                                <option value="">-- Choose area to rate --</option>
                                                {locations.map(loc => (
                                                    <option key={loc.value} value={loc.value}>{loc.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Star Rating */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-3">2. Your Rating <span className="text-rose-500">*</span></label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    onClick={() => setRatingValue(star)}
                                                    onMouseEnter={() => setRatingHover(star)}
                                                    onMouseLeave={() => setRatingHover(0)}
                                                    className="p-1 transition-transform hover:scale-125 active:scale-95"
                                                >
                                                    <Star
                                                        size={36}
                                                        className={`transition-colors ${(ratingHover || ratingValue) >= star
                                                            ? 'text-amber-400 fill-amber-400'
                                                            : 'text-slate-200'
                                                            }`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2 font-medium">
                                            {ratingValue === 1 && 'Very Poor'}
                                            {ratingValue === 2 && 'Poor'}
                                            {ratingValue === 3 && 'Average'}
                                            {ratingValue === 4 && 'Good'}
                                            {ratingValue === 5 && 'Excellent'}
                                        </p>
                                    </div>

                                    {/* Comment */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-3">3. Comments (optional)</label>
                                        <textarea
                                            value={ratingComment}
                                            onChange={(e) => setRatingComment(e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-100 text-slate-900 rounded-xl px-4 py-4 text-sm font-medium outline-none min-h-[100px] resize-y focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                            placeholder="Any suggestions for improvement?"
                                        ></textarea>
                                    </div>

                                    {/* Submit */}
                                    <button
                                        onClick={handleSubmitRating}
                                        disabled={ratingSubmitting || !ratingLocation || !ratingValue}
                                        className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-8 py-4 rounded-xl text-base font-bold cursor-pointer w-full hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {ratingSubmitting ? (<><Loader2 size={18} className="animate-spin" /> Submitting...</>) : (<>Submit Rating <Star size={18} /></>)}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: Recent Ratings + Stats */}
                        <div className="space-y-6">
                            {/* Average Ratings by Location */}
                            {portalStats.ratingsByLocation.length > 0 && (
                                <div className="bg-white rounded-3xl shadow-[0_2px_20px_-3px_rgba(6,81,237,0.08)] border border-slate-100 p-6">
                                    <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-4 flex items-center gap-2">
                                        <Star size={16} className="text-amber-500 fill-amber-500" /> Average Ratings
                                    </h3>
                                    <div className="space-y-3">
                                        {portalStats.ratingsByLocation.map(r => (
                                            <div key={r.location} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                <span className="text-sm font-semibold text-slate-700 capitalize">{r.location?.replace('_', ' ')}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex">
                                                        {[1, 2, 3, 4, 5].map(s => (
                                                            <Star key={s} size={14} className={s <= Math.round(r.avgRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500">{r.avgRating}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Reviews */}
                            <div className="bg-white rounded-3xl shadow-[0_2px_20px_-3px_rgba(6,81,237,0.08)] border border-slate-100 p-6">
                                <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-4 flex items-center gap-2">
                                    <MessageSquare size={16} className="text-indigo-500" /> Recent Feedback
                                </h3>
                                {loadingRatings ? (
                                    <div className="text-center py-8 text-slate-400 text-sm"><Loader2 size={16} className="animate-spin inline mr-2" />Loading...</div>
                                ) : ratings.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 text-sm italic">No ratings yet. Be the first!</div>
                                ) : (
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                                        {ratings.slice(0, 8).map(r => (
                                            <div key={r.id} className="border-l-2 border-emerald-200 pl-4 py-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="flex">{[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />)}</div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider capitalize">{r.location?.replace('_', ' ')}</span>
                                                </div>
                                                {r.comment && <p className="text-sm text-slate-600 font-medium leading-snug">{r.comment}</p>}
                                                <div className="text-[10px] text-slate-400 mt-1">{new Date(r.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
