"use client";

import * as React from "react";
import { Button } from "@/components/atoms";
import { Download, Award } from "lucide-react";
import jsPDF from "jspdf";

interface CertificateDownloadButtonProps {
    studentName: string;
    courseName: string;
    instructorName: string;
    completionDate: string;
    className?: string;
}

export const CertificateDownloadButton: React.FC<CertificateDownloadButtonProps> = ({
    studentName,
    courseName,
    instructorName,
    completionDate,
    className,
}) => {
    const [isGenerating, setIsGenerating] = React.useState(false);

    const generateCertificate = () => {
        setIsGenerating(true);

        try {
            // Create landscape PDF (A4)
            const doc = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4",
            });

            // Background
            doc.setFillColor(250, 250, 255);
            doc.rect(0, 0, 297, 210, "F");

            // Border
            doc.setDrawColor(79, 70, 229); // Indigo-600
            doc.setLineWidth(2);
            doc.rect(10, 10, 277, 190);

            doc.setDrawColor(224, 231, 255); // Indigo-100
            doc.setLineWidth(1);
            doc.rect(15, 15, 267, 180);

            // Header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(40);
            doc.setTextColor(31, 41, 55); // Gray-800
            doc.text("Certificate of Completion", 148.5, 50, { align: "center" });

            // Subheader
            doc.setFont("helvetica", "normal");
            doc.setFontSize(16);
            doc.setTextColor(107, 114, 128); // Gray-500
            doc.text("This is to certify that", 148.5, 70, { align: "center" });

            // Student Name
            doc.setFont("times", "italic");
            doc.setFontSize(36);
            doc.setTextColor(79, 70, 229); // Indigo-600
            doc.text(studentName, 148.5, 90, { align: "center" });

            // Line under name
            doc.setDrawColor(209, 213, 219); // Gray-300
            doc.setLineWidth(0.5);
            doc.line(80, 95, 217, 95);

            // Successfully completed
            doc.setFont("helvetica", "normal");
            doc.setFontSize(16);
            doc.setTextColor(107, 114, 128);
            doc.text("has successfully completed the course", 148.5, 110, { align: "center" });

            // Course Name
            doc.setFont("helvetica", "bold");
            doc.setFontSize(24);
            doc.setTextColor(31, 41, 55);
            doc.text(courseName, 148.5, 125, { align: "center" });

            // Instructor and Date section
            const bottomY = 160;

            // Instructor Signature Area
            doc.setFont("times", "italic");
            doc.setFontSize(18);
            doc.setTextColor(31, 41, 55);
            doc.text(instructorName, 80, bottomY, { align: "center" });

            doc.setDrawColor(31, 41, 55);
            doc.setLineWidth(0.5);
            doc.line(50, bottomY + 2, 110, bottomY + 2);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(107, 114, 128);
            doc.text("Instructor", 80, bottomY + 8, { align: "center" });

            // Date Area
            doc.setFont("helvetica", "normal");
            doc.setFontSize(18);
            doc.setTextColor(31, 41, 55);
            doc.text(completionDate, 217, bottomY, { align: "center" });

            doc.setDrawColor(31, 41, 55);
            doc.setLineWidth(0.5);
            doc.line(187, bottomY + 2, 247, bottomY + 2);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(107, 114, 128);
            doc.text("Date", 217, bottomY + 8, { align: "center" });

            // Footer / ID
            doc.setFontSize(8);
            doc.setTextColor(156, 163, 175);
            const certId = "CERT-" + Math.random().toString(36).substr(2, 9).toUpperCase();
            doc.text(`Certificate ID: ${certId}`, 148.5, 195, { align: "center" });
            doc.text("Core Creator Platform", 148.5, 199, { align: "center" });

            // Save
            doc.save(`${courseName.replace(/\s+/g, "_")}_Certificate.pdf`);
        } catch (error) {
            console.error("Failed to generate certificate", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            onClick={generateCertificate}
            disabled={isGenerating}
            className={className}
        >
            {isGenerating ? (
                "Generating..."
            ) : (
                <>
                    <Award className="w-4 h-4 mr-2" />
                    Download Certificate
                </>
            )}
        </Button>
    );
};
