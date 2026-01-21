declare module 'react-quill-new' {
    import React from 'react';
    export interface ReactQuillProps {
        value?: string;
        defaultValue?: string;
        onChange?: (content: string, delta: any, source: string, editor: any) => void;
        theme?: string;
        modules?: any;
        formats?: string[];
        placeholder?: string;
        className?: string;
        readOnly?: boolean;
        bounds?: string | HTMLElement;
        scrollingContainer?: string | HTMLElement;
        preserveWhitespace?: boolean;
        tabIndex?: number;
    }
    export default class ReactQuill extends React.Component<ReactQuillProps> { }
}
