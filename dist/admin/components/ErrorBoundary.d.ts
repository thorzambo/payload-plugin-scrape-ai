import React from 'react';
interface Props {
    children: React.ReactNode;
    fallbackLabel?: string;
}
interface State {
    hasError: boolean;
    error: Error | null;
}
export declare class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props);
    static getDerivedStateFromError(error: Error): State;
    render(): string | number | bigint | boolean | import("react/jsx-runtime").JSX.Element | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined;
}
export {};
//# sourceMappingURL=ErrorBoundary.d.ts.map