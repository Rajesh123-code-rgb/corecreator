"use client";

import * as React from "react";
import Link from "next/link";
import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import { Button } from "@/components/atoms";
import { Card } from "@/components/molecules";
import {
    MessageSquare,
    Users,
    TrendingUp,
    Award,
    Search,
    Plus,
    ThumbsUp,
    MessageCircle,
    Eye,
    Clock,
    Tag,
    Filter,
    ChevronRight,
} from "lucide-react";

const categories = [
    { name: "General Discussion", count: 1234, icon: MessageSquare, color: "bg-blue-500" },
    { name: "Techniques & Tips", count: 856, icon: TrendingUp, color: "bg-green-500" },
    { name: "Critique & Feedback", count: 542, icon: Award, color: "bg-purple-500" },
    { name: "Marketplace Q&A", count: 321, icon: Tag, color: "bg-orange-500" },
    { name: "Introductions", count: 678, icon: Users, color: "bg-pink-500" },
];

const featuredTopics = [
    {
        id: "1",
        title: "Best watercolor techniques for beginners?",
        author: "Sarah Johnson",
        avatar: "https://randomuser.me/api/portraits/women/1.jpg",
        category: "Techniques & Tips",
        replies: 45,
        views: 1234,
        likes: 89,
        lastActivity: "2 hours ago",
        isPinned: true,
    },
    {
        id: "2",
        title: "Share your latest artwork! Weekly showcase thread",
        author: "Community Team",
        avatar: "https://randomuser.me/api/portraits/men/2.jpg",
        category: "General Discussion",
        replies: 156,
        views: 3421,
        likes: 234,
        lastActivity: "15 min ago",
        isPinned: true,
    },
    {
        id: "3",
        title: "Feedback on my first oil painting - Mountain Sunrise",
        author: "Michael Chen",
        avatar: "https://randomuser.me/api/portraits/men/3.jpg",
        category: "Critique & Feedback",
        replies: 23,
        views: 567,
        likes: 45,
        lastActivity: "4 hours ago",
    },
    {
        id: "4",
        title: "Which digital art tablet should I buy in 2024?",
        author: "Emily Rose",
        avatar: "https://randomuser.me/api/portraits/women/4.jpg",
        category: "General Discussion",
        replies: 67,
        views: 2345,
        likes: 78,
        lastActivity: "1 day ago",
    },
    {
        id: "5",
        title: "Tips for selling art prints online",
        author: "David Lee",
        avatar: "https://randomuser.me/api/portraits/men/5.jpg",
        category: "Marketplace Q&A",
        replies: 34,
        views: 890,
        likes: 56,
        lastActivity: "3 hours ago",
    },
];

const topContributors = [
    { name: "Emma Rodriguez", points: 2345, avatar: "https://randomuser.me/api/portraits/women/5.jpg" },
    { name: "James Wilson", points: 1987, avatar: "https://randomuser.me/api/portraits/men/6.jpg" },
    { name: "Sophie Martin", points: 1654, avatar: "https://randomuser.me/api/portraits/women/7.jpg" },
    { name: "Alex Turner", points: 1432, avatar: "https://randomuser.me/api/portraits/men/8.jpg" },
    { name: "Maria Garcia", points: 1298, avatar: "https://randomuser.me/api/portraits/women/9.jpg" },
];

export default function CommunityPage() {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedCategory, setSelectedCategory] = React.useState("all");

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            <main className="pt-20 pb-16">
                {/* Hero Section */}
                <section className="bg-gradient-to-r from-purple-600 to-indigo-700 py-12">
                    <div className="container-app">
                        <div className="text-center text-white">
                            <h1 className="text-3xl md:text-4xl font-bold mb-4">Community Forum</h1>
                            <p className="text-purple-100 max-w-2xl mx-auto mb-8">
                                Connect with fellow artists, share your work, get feedback, and learn together
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <div className="relative max-w-md mx-auto sm:mx-0 flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="search"
                                        placeholder="Search discussions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50"
                                    />
                                </div>
                                <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-purple-50">
                                    <Plus className="w-5 h-5 mr-2" />
                                    New Topic
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="container-app py-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Main Content */}
                        <div className="flex-1">
                            {/* Categories */}
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                {categories.slice(0, 3).map((category) => (
                                    <Card
                                        key={category.name}
                                        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 ${category.color} rounded-lg flex items-center justify-center`}>
                                                <category.icon className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{category.name}</p>
                                                <p className="text-sm text-gray-500">{category.count} topics</p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {/* Topics List */}
                            <Card className="overflow-hidden">
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                    <h2 className="font-semibold text-lg">Recent Discussions</h2>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map((cat) => (
                                            <option key={cat.name} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="divide-y divide-gray-100">
                                    {featuredTopics.map((topic) => (
                                        <Link
                                            key={topic.id}
                                            href={`/community/topic/${topic.id}`}
                                            className="flex gap-4 p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <img
                                                src={topic.avatar}
                                                alt={topic.author}
                                                className="w-10 h-10 rounded-full"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {topic.isPinned && (
                                                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                                            Pinned
                                                        </span>
                                                    )}
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                        {topic.category}
                                                    </span>
                                                </div>
                                                <h3 className="font-medium text-gray-900 hover:text-purple-600 transition-colors line-clamp-1">
                                                    {topic.title}
                                                </h3>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                    <span>{topic.author}</span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageCircle className="w-4 h-4" />
                                                        {topic.replies}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="w-4 h-4" />
                                                        {topic.views}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <ThumbsUp className="w-4 h-4" />
                                                        {topic.likes}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="hidden sm:flex flex-col items-end justify-center">
                                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {topic.lastActivity}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                <div className="p-4 border-t border-gray-100 text-center">
                                    <Button variant="outline">
                                        View All Discussions <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <aside className="w-full lg:w-80 space-y-6">
                            {/* Community Stats */}
                            <Card className="p-6">
                                <h3 className="font-semibold mb-4">Community Stats</h3>
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="p-3 bg-purple-50 rounded-lg">
                                        <p className="text-2xl font-bold text-purple-600">12.8K</p>
                                        <p className="text-sm text-gray-500">Members</p>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <p className="text-2xl font-bold text-blue-600">3.5K</p>
                                        <p className="text-sm text-gray-500">Topics</p>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <p className="text-2xl font-bold text-green-600">45K</p>
                                        <p className="text-sm text-gray-500">Replies</p>
                                    </div>
                                    <div className="p-3 bg-orange-50 rounded-lg">
                                        <p className="text-2xl font-bold text-orange-600">234</p>
                                        <p className="text-sm text-gray-500">Online Now</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Top Contributors */}
                            <Card className="p-6">
                                <h3 className="font-semibold mb-4">Top Contributors</h3>
                                <div className="space-y-3">
                                    {topContributors.map((user, index) => (
                                        <div key={user.name} className="flex items-center gap-3">
                                            <span className="w-6 text-center font-bold text-gray-400">
                                                {index + 1}
                                            </span>
                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                className="w-8 h-8 rounded-full"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{user.name}</p>
                                            </div>
                                            <span className="text-sm text-purple-600 font-medium">
                                                {user.points.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* All Categories */}
                            <Card className="p-6">
                                <h3 className="font-semibold mb-4">Categories</h3>
                                <div className="space-y-2">
                                    {categories.map((category) => (
                                        <Link
                                            key={category.name}
                                            href={`/community?category=${encodeURIComponent(category.name)}`}
                                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 ${category.color} rounded-lg flex items-center justify-center`}>
                                                    <category.icon className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="text-sm font-medium">{category.name}</span>
                                            </div>
                                            <span className="text-xs text-gray-500">{category.count}</span>
                                        </Link>
                                    ))}
                                </div>
                            </Card>
                        </aside>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
