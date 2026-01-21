export interface ErrorResponse {
    code:string;
    message:string;
    timestamp:Date;
}

export interface ToastMessage {
    type: 'success' | 'error' | 'warning' | 'info';
    message:string;
    duration?:number;
}