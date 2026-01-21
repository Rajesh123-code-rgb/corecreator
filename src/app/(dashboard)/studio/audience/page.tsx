"use client";

import * as React from "react";
import { Button } from "@/components/atoms";
import { Card } from "@/components/molecules";
import { Search, Mail, Loader2, Users, BookOpen } from "lucide-react";

interface Student {
    id: string;
    name: string;
    email: string;
    course: string;
    progress: number;
    lastActive: string;
    avatar: string;
}

export default function AudiencePage() {
    const [students, setStudents] = React.useState<Student[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState("");

    // Note: This would need a dedicated API endpoint /api/studio/audience
    // For now, we'll show the structure
    React.useEffect(() => {
        // Placeholder - would fetch from API
        setLoading(false);
    }, [searchQuery]);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Audience</h1>
                    <p className="text-[var(--muted-foreground)]">Manage your students and followers</p>
                </div>
                <Button variant="outline">
                    <Mail className="w-4 h-4 mr-2" />
                    Message All
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">0</p>
                            <p className="text-xs text-[var(--muted-foreground)]">Total Students</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">0</p>
                            <p className="text-xs text-[var(--muted-foreground)]">Active Learners</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">0</p>
                            <p className="text-xs text-[var(--muted-foreground)]">Course Completions</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <input
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Students List */}
            <Card>
                <div className="p-8 text-center text-[var(--muted-foreground)]">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No students yet. Students will appear here once they enroll in your courses.</p>
                </div>
            </Card>
        </div>
    );
}
