import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { searchUsers, removeFriend, getFriends } from '../../services/userApi.js';
import { createChat } from '../../services/chatApi.js';
import toast from 'react-hot-toast';

function UserProfilePage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [messages, setMessages] = useState([]); // Placeholder if we want to show shared history later

    // Relationship state
    const [relationship, setRelationship] = useState('NONE'); // NONE, SENT, RECEIVED, FRIEND
    const [requestId, setRequestId] = useState(null);

    useEffect(() => {
        async function loadProfile() {
            try {
                // reuse searchUsers by ID to get relationships + info
                // Not the most efficient but avoids creating new endpoint for now as per plan
                // Actually, let's just use searchUsers with `by=id` which now returns 1 result with relationship

                // We'll search by comradeId if userId is actually a comradeId, 
                // BUT the route likely passes the DB _id. 
                // Search API expects `query` and `by`.

                // ISSUE: Search API searches by comradeId string, but here we might have database ID.
                // Let's assume for now we link via ID. We might need a proper `getUser` endpoint?
                // The current implementation of `searchUsers` doesn't support "get by ID" cleanly unless we change it.
                // User.controller.js -> `filter` logic. 

                // Let's try to fetch all friends and see if they are in there? No, that's only for friends.
                // Let's quick-add `getUserById` to `user.controller.js`?
                // Or we can just use the search API if we pass the comradeId. 
                // The link from Friend List likely has the ID.

                // Better approach: Create a dedicated fetch function in this component that calls a new endpoint
                // OR reuse search if we know the comradeId.
                // Let's assume we link using `comradeId` in the URL for better aesthetics? 
                // Route: /profile/:comradeId

                const res = await searchUsers({ query: userId, by: 'id' });
                // If we passed the DB ID, this BY='id' means comradeId in backend. 
                // If we pass DB ID, we need to handle that.

                // Let's stick to using `comradeId` in URL. 

                if (res.users && res.users.length > 0) {
                    // Find exact match (search might be fuzzy)
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
            // Use chatId for navigation (string ID), not _id
            navigate(`/chat/${res.chat.chatId}`);
        } catch (e) {
            console.error(e);
            toast.error('Failed to start chat');
        }
    }

    const handleBack = () => navigate(-1);

    if (loading) return <div className="flex justify-center py-10"><span className="subtle-text animate-pulse">Loading profile...</span></div>;
    if (error) return <div className="flex justify-center py-10"><span className="text-red-400">{error}</span></div>;
    if (!profile) return null;

    return (
        <main className="mx-auto max-w-2xl px-4 py-8">
            <button
                onClick={handleBack}
                className="mb-6 flex items-center gap-2 text-slate-400 hover:text-slate-200 transition"
            >
                ← Back
            </button>

            <div className="card overflow-hidden border border-slate-700/50 bg-slate-800/40 backdrop-blur-md">
                <div className="h-32 bg-gradient-to-r from-brand-900 to-slate-900"></div>
                <div className="px-6 pb-6 relative">
                    {/* Avatar and Action Row - Fixed Alignment */}
                    <div className="flex justify-between items-end -mt-12 mb-4">
                        <div className="relative">
                            <div className="h-24 w-24 rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center text-3xl font-bold text-slate-300 shadow-xl">
                                {profile.name.charAt(0).toUpperCase()}
                            </div>
                            <div className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-slate-900 ${profile.isOnline ? 'bg-green-500' : 'bg-slate-500'}`} />
                        </div>

                        <div className="mb-2">
                            {relationship === 'FRIEND' && (
                                <button onClick={handleMessage} className="btn-primary px-6 py-2 text-sm font-medium">Message</button>
                            )}
                            {relationship === 'NONE' && (
                                <button className="btn-primary px-6 py-2 text-sm font-medium">Add Friend</button>
                            )}
                            {relationship === 'SENT' && (
                                <button disabled className="btn-secondary px-6 py-2 text-sm font-medium opacity-50 cursor-not-allowed">Request Sent</button>
                            )}
                        </div>
                    </div>

                    {/* Text Content */}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100">{profile.name}</h1>
                        <p className="text-brand-400 font-mono">@{profile.comradeId}</p>

                        <div className="mt-4 space-y-2 text-sm text-slate-400">
                            <p className="flex items-center gap-2">
                                <span>📅</span>
                                Joined {new Date(profile.createdAt || Date.now()).toLocaleDateString()}
                            </p>
                            {profile.isOnline ? (
                                <p className="flex items-center gap-2 text-green-400">
                                    <span className="h-2 w-2 rounded-full bg-green-500"></span> Online Now
                                </p>
                            ) : (
                                <p className="flex items-center gap-2">
                                    <span>🕒</span> Last seen {profile.lastSeenAt ? new Date(profile.lastSeenAt).toLocaleString() : 'Recently'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default UserProfilePage;
