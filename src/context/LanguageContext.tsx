"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Simple translation dictionary
const translations: Record<string, Record<string, string>> = {
    en: {
        "dashboard.welcome": "Welcome back",
        "dashboard.my_courses": "My Courses",
        "dashboard.marketplace": "Marketplace",
        "dashboard.continue_learning": "Continue Learning",
        "dashboard.my_workshops": "My Workshops",
        "dashboard.my_orders": "My Orders",
        "dashboard.wishlist": "Wishlist",
        "dashboard.certificates": "Certificates",
        "dashboard.profile": "Profile",
        "dashboard.settings": "Settings",
        "dashboard.recent_orders": "Recent Orders",
        "dashboard.upcoming_workshops": "Upcoming Workshops",
        "dashboard.view_all": "View All",
        "dashboard.no_courses": "No courses enrolled yet.",
        "dashboard.no_workshops": "No upcoming workshops.",
        "dashboard.browse_workshops": "Browse Workshops",
        "dashboard.no_orders": "No recent orders.",
        "dashboard.courses.title": "My Learning",
        "dashboard.courses.subtitle": "Manage your courses and track your progress",
        "dashboard.courses.search_placeholder": "Search courses...",
        "dashboard.courses.filter": "Filter",
        "dashboard.courses.start": "Start Course",
        "dashboard.courses.continue": "Continue Learning",
        "dashboard.courses.lessons": "lessons",
        "dashboard.courses.complete": "complete",
        "dashboard.courses.browse": "Browse Courses",
        "dashboard.courses.empty_search": "Try adjusting your search terms",
        "dashboard.courses.empty": "You haven't enrolled in any courses yet.",
        "dashboard.workshops.title": "My Workshops",
        "dashboard.workshops.empty": "You haven't registered for any workshops yet.",
        "dashboard.workshops.browse": "Browse Workshops",
        "dashboard.workshops.view_details": "View Details",
        "dashboard.orders.title": "My Orders",
        "dashboard.orders.empty": "You haven't placed any orders yet. Explore our marketplace and courses.",
        "dashboard.orders.browse_products": "Browse Products",
        "dashboard.orders.order_placed": "Order Placed",
        "dashboard.orders.order_number": "Order #",
        "dashboard.orders.quantity": "Qty",
        "dashboard.wishlist.title": "My Wishlist",
        "dashboard.wishlist.empty_title": "Your wishlist is empty",
        "dashboard.wishlist.empty_desc": "Save items you want to buy later.",
        "dashboard.certificates.title": "My Certificates",
        "dashboard.certificates.subtitle": "Access and download certificates for your completed courses.",
        "dashboard.certificates.empty_title": "No certificates earned yet",
        "dashboard.certificates.empty_desc": "Complete a course 100% to earn your certificate.",
        "dashboard.certificates.resume_learning": "Resume Learning",
        "dashboard.certificates.download": "Download",
        "dashboard.certificates.id": "ID",
        "dashboard.certificates.preview_title": "CERTIFICATE",
        "dashboard.certificates.preview_subtitle": "of completion",
        "dashboard.profile.title": "My Profile",
        "dashboard.profile.subtitle": "Manage your personal information and addresses",
        "dashboard.profile.personal_info": "Personal Information",
        "dashboard.profile.full_name": "Full Name",
        "dashboard.profile.email": "Email",
        "dashboard.profile.phone": "Phone Number",
        "dashboard.profile.location": "Location",
        "dashboard.profile.bio": "Bio",
        "dashboard.profile.saved_addresses": "Saved Addresses",
        "dashboard.profile.add_address": "Add Address",
        "dashboard.profile.no_addresses": "No addresses saved. Add one for faster checkout.",
        "dashboard.profile.label": "Label",
        "dashboard.profile.country": "Country",
        "dashboard.profile.street": "Street Address",
        "dashboard.profile.city": "City",
        "dashboard.profile.state": "State",
        "dashboard.profile.zip": "Zip Code",
        "dashboard.profile.default": "Set as default address",
        "dashboard.profile.save": "Save Changes",
        "dashboard.profile.saved": "Saved!",
        "dashboard.profile.loading": "Loading profile...",
        "dashboard.profile.address_type_home": "Home",
        "dashboard.profile.address_type_work": "Work",
        "dashboard.profile.address_type_billing": "Billing",
        "dashboard.profile.address_type_shipping": "Shipping",
        "stats.enrolled": "Courses Enrolled",
        "stats.completed": "Completed",
        "stats.workshops": "Upcoming Workshops",
        "stats.orders": "Total Orders",
        "common.items": "items",
        "common.status": "Status",
        "common.date": "Date",
        "common.total": "Total",
        "common.action": "Action",
        "settings.title": "Settings",
        "settings.preferences": "Preferences",
        "settings.save": "Save Changes",
        "settings.saved": "Saved!",
    },
    hi: {
        "dashboard.welcome": "वापसी पर स्वागत है",
        "dashboard.my_courses": "मेरे पाठ्यक्रम",
        "dashboard.marketplace": "बाज़ार",
        "dashboard.continue_learning": "सीखना जारी रखें",
        "dashboard.my_workshops": "मेरी कार्यशालाएं",
        "dashboard.my_orders": "मेरे ऑर्डर",
        "dashboard.wishlist": "इच्छा सूची",
        "dashboard.certificates": "प्रमाण पत्र",
        "dashboard.profile": "प्रोफाइल",
        "dashboard.settings": "सेटिंग्स",
        "dashboard.recent_orders": "हाल के ऑर्डर",
        "dashboard.upcoming_workshops": "आगामी कार्यशालाएं",
        "dashboard.view_all": "सभी देखें",
        "dashboard.no_courses": "अभी तक कोई पाठ्यक्रम नहीं।",
        "dashboard.no_workshops": "कोई आगामी कार्यशाला नहीं।",
        "dashboard.browse_workshops": "कार्यशालाएं ब्राउज़ करें",
        "dashboard.no_orders": "कोई हालिया आदेश नहीं।",
        "dashboard.courses.title": "मेरा शिक्षण",
        "dashboard.courses.subtitle": "अपने पाठ्यक्रमों का प्रबंधन करें और अपनी प्रगति को ट्रैक करें",
        "dashboard.courses.search_placeholder": "पाठ्यक्रम खोजें...",
        "dashboard.courses.filter": "फ़िल्टर",
        "dashboard.courses.start": "पाठ्यक्रम शुरू करें",
        "dashboard.courses.continue": "सीखना जारी रखें",
        "dashboard.courses.lessons": "पाठ",
        "dashboard.courses.complete": "पूर्ण",
        "dashboard.courses.browse": "पाठ्यक्रम ब्राउज़ करें",
        "dashboard.courses.empty_search": "अपने खोजशब्दों को समायोजित करने का प्रयास करें",
        "dashboard.courses.empty": "आपने अभी तक किसी भी पाठ्यक्रम में नामांकन नहीं किया है।",
        "dashboard.workshops.title": "मेरी कार्यशालाएं",
        "dashboard.workshops.empty": "आपने अभी तक किसी भी कार्यशाला के लिए पंजीकरण नहीं कराया है।",
        "dashboard.workshops.browse": "कार्यशालाएं ब्राउज़ करें",
        "dashboard.workshops.view_details": "विवरण देखें",
        "dashboard.orders.title": "मेरे ऑर्डर",
        "dashboard.orders.empty": "आपने अभी तक कोई ऑर्डर नहीं दिया है। हमारे बाज़ार और पाठ्यक्रमों का अन्वेषण करें।",
        "dashboard.orders.browse_products": "उत्पाद ब्राउज़ करें",
        "dashboard.orders.order_placed": "ऑर्डर दिया गया",
        "dashboard.orders.order_number": "ऑर्डर #",
        "dashboard.orders.quantity": "मात्रा",
        "dashboard.wishlist.title": "मेरी इच्छा सूची",
        "dashboard.wishlist.empty_title": "आपकी इच्छा सूची खाली है",
        "dashboard.wishlist.empty_desc": "उन वस्तुओं को सहेजें जिन्हें आप बाद में खरीदना चाहते हैं।",
        "dashboard.certificates.title": "मेरे प्रमाण पत्र",
        "dashboard.certificates.subtitle": "अपने पूर्ण किए गए पाठ्यक्रमों के लिए प्रमाणपत्रों तक पहुंचें और डाउनलोड करें।",
        "dashboard.certificates.empty_title": "अभी तक कोई प्रमाण पत्र अर्जित नहीं किया है",
        "dashboard.certificates.empty_desc": "अपना प्रमाण पत्र अर्जित करने के लिए एक पाठ्यक्रम 100% पूरा करें।",
        "dashboard.certificates.resume_learning": "सीखना फिर से शुरू करें",
        "dashboard.certificates.download": "डाउनलोड",
        "dashboard.certificates.id": "आईडी",
        "dashboard.certificates.preview_title": "प्रमाण पत्र",
        "dashboard.certificates.preview_subtitle": "पूर्ण होने का",
        "dashboard.profile.title": "मेरी प्रोफाइल",
        "dashboard.profile.subtitle": "अपनी व्यक्तिगत जानकारी और पतों का प्रबंधन करें",
        "dashboard.profile.personal_info": "व्यक्तिगत जानकारी",
        "dashboard.profile.full_name": "पूरा नाम",
        "dashboard.profile.email": "ईमेल",
        "dashboard.profile.phone": "फ़ोन नंबर",
        "dashboard.profile.location": "स्थान",
        "dashboard.profile.bio": "बायो",
        "dashboard.profile.saved_addresses": "सहेजे गए पते",
        "dashboard.profile.add_address": "पता जोड़ें",
        "dashboard.profile.no_addresses": "कोई पता सहेजा नहीं गया। तेज़ चेकआउट के लिए एक जोड़ें।",
        "dashboard.profile.label": "लेबल",
        "dashboard.profile.country": "देश",
        "dashboard.profile.street": "सड़क का पता",
        "dashboard.profile.city": "शहर",
        "dashboard.profile.state": "राज्य",
        "dashboard.profile.zip": "पिन कोड",
        "dashboard.profile.default": "डिफ़ॉल्ट पते के रूप में सेट करें",
        "dashboard.profile.save": "परिवर्तन सहेजें",
        "dashboard.profile.saved": "सहेजा गया!",
        "dashboard.profile.loading": "प्रोफ़ाइल लोड हो रही है...",
        "dashboard.profile.address_type_home": "घर",
        "dashboard.profile.address_type_work": "काम",
        "dashboard.profile.address_type_billing": "बिलिंग",
        "dashboard.profile.address_type_shipping": "शीर्ष",
        "stats.enrolled": "नामांकित पाठ्यक्रम",
        "stats.completed": "पुरा होना",
        "stats.workshops": "आगामी कार्यशालाएं",
        "stats.orders": "कुल ऑर्डर",
        "common.items": "वस्तुओं",
        "dashboard.menu.dashboard": "डैशबोर्ड",
        "common.status": "स्थिति",
        "common.date": "तारीख",
        "common.total": "कुल",
        "common.action": "कार्रवाई",
        "settings.title": "सेटिंग्स",
        "settings.preferences": "प्राथमिकताएं",
        "settings.save": "परिवर्तन सहेजें",
        "settings.saved": "सहेजा गया!",
    },
    es: {
        "dashboard.welcome": "Bienvenido de nuevo",
        "dashboard.my_courses": "Mis Cursos",
    }
};

type Language = "en" | "hi";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>("en");

    // Load from localStorage on mount
    useEffect(() => {
        const savedLang = localStorage.getItem("app-language") as Language;
        if (savedLang && (savedLang === "en" || savedLang === "hi")) {
            setLanguage(savedLang);
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        localStorage.setItem("app-language", language);
        // Optionally sync with User DB here (debounce recommended)
    }, [language]);

    const t = (key: string) => {
        return translations[language]?.[key] || translations["en"]?.[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
