import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { searchUsers, removeFriend, getFriends } from '../../services/userApi.js';
import { createChat } from '../../services/chatApi.js';
import toast from 'react-hot-toast';
import {
  ArrowLeft, MessageCircle, UserPlus, Clock, Calendar, Send
} from 'lucide-react';

function UserProfilePage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [relationship, setRelationship] = useState('NONE');
    const [requestId, setRequestId] = useState(null);

    useEffect(() => {
        async function loadProfile() {
            try {
                const res = await searchUsers({ query: userId, by: 'id' });
                if (res.users && res.users.length > 0) {
                    const match = res.users.find(u => u.comradeId === userId || u._id === userId);
                    if (match) {
                        setProfile(match);
                        setRelationship(match.relationship);
                        setRequestId(match.requestId);
                    } else {
                        setError('User not found');
                    }
                } else {
                    setError('User not found');
                }
            } catch (err) {
                setError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [userId]);

    async function handleMessage() {
        try {
            const res = await createChat(profile._id);
            navigate(`/chat/${res.chat.chatId}`);
        } catch (e) {
            toast.error('Failed to start chat');
        }
    }

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
    if (error) return (
        <div className="flex min-h-screen items-center justify-center">
            <p className="text-red-400 text-sm">{error}</p>
        </div>
    );
    if (!profile) return null;

    return (
        <main className="mx-auto max-w-2xl px-4 py-8">
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition group"
            >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back
            </button>

            <div className="card overflow-hidden border border-slate-800/50 bg-slate-900/60 backdrop-blur-md shadow-xl animate-fadeIn">
                {/* Cover */}
                <div className="h-36 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-600/40 via-brand-900/60 to-slate-950" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(99,102,241,0.3)_0%,transparent_60%)]" />
                </div>

                <div className="px-6 pb-6 relative">
                    {/* Avatar + Actions */}
                    <div className="flex justify-between items-end -mt-14 mb-5">
                        <div className="relative">
                            <div className="h-28 w-28 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 border-4 border-slate-900 flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-brand-900/30">
                                {profile.name.charAt(0).toUpperCase()}
                            </div>
                            <div className={`absolute bottom-2 right-2 h-5 w-5 rounded-full border-[3px] border-slate-900 shadow ${profile.isOnline ? 'bg-green-400' : 'bg-slate-500'}`} />
                        </div>

                        <div className="mb-2">
                            {relationship === 'FRIEND' && (
                                <button onClick={handleMessage} className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-medium shadow-lg shadow-brand-900/30">
                                    <MessageCircle className="h-4 w-4" /> Message
                                </button>
                            )}
                            {relationship === 'NONE' && (
                                <button className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-medium">
                                    <UserPlus className="h-4 w-4" /> Add Friend
                                </button>
                            )}
                            {relationship === 'SENT' && (
                                <button disabled className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-slate-800 text-slate-400 rounded-lg border border-slate-700 cursor-not-allowed">
                                    <Send className="h-4 w-4" /> Request Sent
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div>
                        <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                        <p className="text-brand-400 font-mono text-sm">@{profile.comradeId}</p>

                        <div className="mt-5 space-y-3">
                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                <div className="p-2 rounded-lg bg-slate-800/60">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <span>Joined {new Date(profile.createdAt || Date.now()).toLocaleDateString()}</span>
                            </div>
                            {profile.isOnline ? (
                                <div className="flex items-center gap-3 text-sm text-green-400">
                                    <div className="p-2 rounded-lg bg-green-500/10">
                                        <span className="flex h-4 w-4 items-center justify-center">
                                            <span className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse" />
                                        </span>
                                    </div>
                                    <span className="font-medium">Online Now</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 text-sm text-slate-400">
                                    <div className="p-2 rounded-lg bg-slate-800/60">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                    <span>Last seen {profile.lastSeenAt ? new Date(profile.lastSeenAt).toLocaleString() : 'Recently'}</span>
                                </div>
                            )}
                        </div>

                        {/* Relationship Badge */}
                        {relationship === 'FRIEND' && (
                            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Friends
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

export default UserProfilePage;
