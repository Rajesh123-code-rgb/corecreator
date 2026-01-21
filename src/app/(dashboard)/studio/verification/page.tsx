"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/molecules";
import { Button, Input } from "@/components/atoms";
import { Loader2, Upload, CheckCircle, AlertCircle, Shield } from "lucide-react";
import Image from "next/image";

export default function StudioVerificationPage() {
    const { data: session, update } = useSession();
    const [loading, setLoading] = React.useState(false);
    const [status, setStatus] = React.useState<"not_submitted" | "pending" | "approved" | "rejected">("not_submitted");
    const [rejectionReason, setRejectionReason] = React.useState("");

    // Form state
    const [personalData, setPersonalData] = React.useState({
        name: session?.user?.name || "",
        email: session?.user?.email || "",
        phone: "",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: ""
    });

    const [idProof, setIdProof] = React.useState<File | null>(null);
    const [addressProof, setAddressProof] = React.useState<File | null>(null);
    const [previews, setPreviews] = React.useState({ id: "", address: "" });

    React.useEffect(() => {
        // In a real app, fetch current KYC status from API
        // For now, rely on session or specific API call
        const fetchStatus = async () => {
            const res = await fetch("/api/studio/verification/status");
            if (res.ok) {
                const data = await res.json();
                setStatus(data.status);
                setRejectionReason(data.rejectionReason || "");
            }
        };
        fetchStatus();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "id" | "address") => {
        const file = e.target.files?.[0];
        if (file) {
            if (type === "id") setIdProof(file);
            else setAddressProof(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({ ...prev, [type]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Helper function to upload a single document
            const uploadDocument = async (file: File, type: string): Promise<string> => {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("type", type);

                const res = await fetch("/api/upload/document", {
                    method: "POST",
                    body: formData
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || "Upload failed");
                }

                const data = await res.json();
                return data.url;
            };

            // Upload both documents
            const documents = [];

            if (idProof) {
                const idUrl = await uploadDocument(idProof, "id_proof");
                documents.push({ type: "id_proof", url: idUrl, verified: false });
            }

            if (addressProof) {
                const addressUrl = await uploadDocument(addressProof, "address_proof");
                documents.push({ type: "address_proof", url: addressUrl, verified: false });
            }

            if (documents.length < 2) {
                alert("Please upload both ID proof and address proof");
                setLoading(false);
                return;
            }

            const payload = {
                documents,
                personalDetails: {
                    name: personalData.name,
                    email: personalData.email,
                    phone: personalData.phone
                },
                address: {
                    street: personalData.street,
                    city: personalData.city,
                    state: personalData.state,
                    zipCode: personalData.zipCode,
                    country: personalData.country
                }
            };

            const res = await fetch("/api/studio/verification/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setStatus("pending");
                update(); // Update session to reflect new status if needed
            } else {
                const error = await res.json();
                alert(error.error || "Submission failed");
            }
        } catch (error) {
            console.error("Verification submit error:", error);
            alert(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };



    // Tracking Component
    const renderTracker = (currentStatus: string) => {
        const steps = [
            { id: "submitted", label: "Application Submitted", status: currentStatus === "not_submitted" ? "pending" : "completed" },
            { id: "review", label: "Under Review", status: currentStatus === "pending" ? "current" : (currentStatus === "approved" || currentStatus === "rejected" ? "completed" : "pending") },
            { id: "decision", label: currentStatus === "approved" ? "Verified" : (currentStatus === "rejected" ? "Rejected" : "Decision"), status: currentStatus === "approved" ? "completed" : (currentStatus === "rejected" ? "error" : "pending") }
        ];

        return (
            <div className="w-full max-w-3xl mx-auto mb-10">
                <div className="relative flex justify-between">
                    {/* Connecting Line */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10 -translate-y-1/2 rounded-full" />
                    <div
                        className="absolute top-1/2 left-0 h-1 bg-green-500 -z-10 -translate-y-1/2 rounded-full transition-all duration-500"
                        style={{ width: currentStatus === 'approved' ? '100%' : (currentStatus === 'pending' ? '50%' : '0%') }}
                    />

                    {steps.map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center bg-white px-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step.status === 'completed' ? 'bg-green-500 border-green-500 text-white' :
                                step.status === 'current' ? 'bg-blue-100 border-blue-500 text-blue-600 animate-pulse' :
                                    step.status === 'error' ? 'bg-red-500 border-red-500 text-white' :
                                        'bg-white border-gray-300 text-gray-400'
                                }`}>
                                {step.status === 'completed' ? <CheckCircle className="w-6 h-6" /> :
                                    step.status === 'error' ? <AlertCircle className="w-6 h-6" /> :
                                        <span className="text-sm font-bold">{idx + 1}</span>}
                            </div>
                            <span className={`text-sm mt-2 font-medium ${step.status === 'completed' ? 'text-green-600' :
                                step.status === 'current' ? 'text-blue-600' :
                                    step.status === 'error' ? 'text-red-600' : 'text-gray-400'
                                }`}>{step.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (status === "approved") {
        return (
            <div className="max-w-3xl mx-auto py-10 text-center space-y-6">
                {renderTracker(status)}

                <div className="bg-green-50 border border-green-100 rounded-2xl p-8">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Verified Studio</h1>
                    <p className="text-gray-500 mt-2 max-w-md mx-auto">
                        Congratulations! Your studio account is fully verified. You can now list unlimited courses, art products, and workshops.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mt-8">
                    <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                        <div className="font-semibold text-gray-900 mb-1">Unlimited Listings</div>
                        <p className="text-sm text-gray-500">Create regular and premium courses without limits.</p>
                    </div>
                    <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                        <div className="font-semibold text-gray-900 mb-1">Instant Payouts</div>
                        <p className="text-sm text-gray-500">Access your earnings faster with verified status.</p>
                    </div>
                    <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                        <div className="font-semibold text-gray-900 mb-1">Verified Badge</div>
                        <p className="text-sm text-gray-500">Gain trust with the blue verification badge on your profile.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === "pending") {
        return (
            <div className="max-w-2xl mx-auto py-10 space-y-8">
                {renderTracker(status)}

                <div className="text-center py-10 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse mb-4">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Verification in Progress</h1>
                    <p className="text-gray-500 mt-2 max-w-md mx-auto">
                        We have received your documents and contact details. Our team is currently reviewing your application.
                    </p>
                    <p className="text-sm text-gray-400 mt-4">Estimated time: 24-48 hours</p>
                </div>

                <div className="text-center">
                    <Button variant="outline" onClick={() => window.location.reload()}>Refresh Status</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Studio Verification</h1>
                <p className="text-gray-500">Verify your identity to unlock selling features</p>
            </div>

            {renderTracker(status)}

            {status === "rejected" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-red-900">Verification Rejected</h3>
                        <p className="text-sm text-red-800 mt-1">{rejectionReason || "Please re-upload clear copies of your documents."}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Personal Details Section */}
                                <div>
                                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm">1</span>
                                        Contact Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Full Name</label>
                                            <Input
                                                value={personalData.name}
                                                onChange={(e) => setPersonalData({ ...personalData, name: e.target.value })}
                                                placeholder="Legal Name"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Mobile Number</label>
                                            <Input
                                                value={personalData.phone}
                                                onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                                                placeholder="+91 98765 43210"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium text-gray-700">Email Address</label>
                                            <Input
                                                value={personalData.email}
                                                disabled
                                                className="bg-gray-50"
                                            />
                                            <p className="text-xs text-gray-500">Email cannot be changed during verification.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Address Section */}
                                <div>
                                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm">2</span>
                                        Studio Address
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium text-gray-700">Street Address</label>
                                            <Input
                                                value={personalData.street}
                                                onChange={(e) => setPersonalData({ ...personalData, street: e.target.value })}
                                                placeholder="123 Studio Lane"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">City</label>
                                            <Input
                                                value={personalData.city}
                                                onChange={(e) => setPersonalData({ ...personalData, city: e.target.value })}
                                                placeholder="Mumbai"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">State</label>
                                            <Input
                                                value={personalData.state}
                                                onChange={(e) => setPersonalData({ ...personalData, state: e.target.value })}
                                                placeholder="Maharashtra"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Zip Code</label>
                                            <Input
                                                value={personalData.zipCode}
                                                onChange={(e) => setPersonalData({ ...personalData, zipCode: e.target.value })}
                                                placeholder="400001"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Country</label>
                                            <Input
                                                value={personalData.country}
                                                onChange={(e) => setPersonalData({ ...personalData, country: e.target.value })}
                                                placeholder="India"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Documents Section */}
                                <div>
                                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm">3</span>
                                        Documents
                                    </h3>
                                    {/* ID Proof Helper */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Government ID Proof</label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-500 transition-colors bg-gray-50 relative">
                                            {previews.id ? (
                                                <div className="relative">
                                                    <img src={previews.id} alt="ID Preview" className="max-h-48 mx-auto rounded-lg" />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setIdProof(null); setPreviews(prev => ({ ...prev, id: "" })) }}
                                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                                    >
                                                        <Upload className="w-4 h-4 rotate-45" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                                    <p className="text-sm text-gray-600 font-medium">Click to upload Passport / Driving License / National ID</p>
                                                    <p className="text-xs text-gray-400 mt-1">JPEG, PNG or PDF (Max 5MB)</p>
                                                    <input
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        onChange={(e) => handleFileChange(e, "id")}
                                                        required={!previews.id}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Address Proof Helper */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Business/Address Proof</label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-500 transition-colors bg-gray-50 relative">
                                            {previews.address ? (
                                                <div className="relative">
                                                    <img src={previews.address} alt="Address Preview" className="max-h-48 mx-auto rounded-lg" />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setAddressProof(null); setPreviews(prev => ({ ...prev, address: "" })) }}
                                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                                    >
                                                        <Upload className="w-4 h-4 rotate-45" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                                    <p className="text-sm text-gray-600 font-medium">Click to upload Utility Bill / Bank Statement / Tax Document</p>
                                                    <p className="text-xs text-gray-400 mt-1">JPEG, PNG or PDF (Max 5MB)</p>
                                                    <input
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        onChange={(e) => handleFileChange(e, "address")}
                                                        required={!previews.address}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>


                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white py-6 text-lg"
                                    disabled={loading || !idProof || !addressProof}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit for Verification"
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Shield className="w-5 h-5 text-amber-600" />
                            <h3 className="font-semibold text-amber-900">Why Verify?</h3>
                        </div>
                        <ul className="space-y-3 text-sm text-amber-800">
                            <li className="flex items-start gap-2">
                                <span className="bg-amber-200 text-amber-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                                Unlock selling privileges for courses and products.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-amber-200 text-amber-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                                Build trust with potential students and customers.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-amber-200 text-amber-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                                Access premium studio tools and analytics.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
