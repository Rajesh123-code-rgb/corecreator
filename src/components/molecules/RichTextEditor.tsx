"use client";

import dynamic from 'next/dynamic';
import React from 'react';
import 'react-quill-new/dist/quill.snow.css';

import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

const ReactQuill = dynamic(
    async () => {
        // @ts-ignore
        if (typeof window !== "undefined") window.hljs = hljs;
        const { default: RQ } = await import("react-quill-new");
        return ({ forwardedRef, ...props }: any) => <RQ ref={forwardedRef} {...props} />;
    },
    { ssr: false, loading: () => <div className="h-64 w-full bg-gray-50 animate-pulse rounded-lg" /> }
);

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const modules = {
    syntax: true,
    toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
        ['link', 'image', 'video'],
        ['clean']
    ],
};

const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block',
    'list', 'indent',
    'link', 'image', 'video'
];

export default function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
    return (
        <div className={`prose-editor ${className}`}>
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                className="bg-white rounded-lg h-[400px] flex flex-col"
            />
            <style jsx global>{`
                .ql-container {
                    font-size: 1rem;
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                    flex: 1;
                    overflow-y: auto;
                }
                .ql-toolbar {
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                    background-color: #f9fafb;
                }
                .ql-editor {
                    min-height: 200px;
                }
            `}</style>
        </div>
    );
}
