import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Order } from "../models/cart.model";
import { catchError, map, Observable, of } from "rxjs";
import { error } from "console";

interface OrderApiResponse {
    id: string;
    userId: string;
    items: string;  // JSON string
    subtotal: number;
    productDiscount: number;
    cartLevelDiscount: number;
    total: number;
    userDetails: string;  // JSON string
    orderDate: string;
    status: string;
    createdAt: string;
}
@Injectable({
    providedIn: 'root'
})

export class OrderService {
    private readonly ORDER_API_URL = 'https://6937b2ba4618a71d77cd4f0c.mockapi.io/orders'

    constructor(private http: HttpClient) { }
    // Create a new order
    createOrder(order: Omit<Order, 'id'>): Observable<Order> {
        // convert order to maockAPI format
        const apiPayLoad = {
            userId: order.userId,
            items: JSON.stringify(order.items),  // Convert array to JSON string
            subtotal: order.subtotal,
            productDiscount: order.productDiscount,
            cartLevelDiscount: order.cartLevelDiscount,
            total: order.total,
            userDetails: JSON.stringify(order.userDetails),  // Convert object to JSON string
            orderDate: order.orderDate.toISOString(),
            status: order.status
        };
        return this.http.post<OrderApiResponse>(this.ORDER_API_URL, apiPayLoad).pipe(
            map(response => this.convertApiResponseToOrder(response)),
            catchError(
                error => {
                    console.error('[OrderService] Failed to create order:', error);
                    throw error;
                })
        );

    }


    //  Get all orders for a specific user
    getUserOrders(userId: string): Observable<Order[]> {
        return this.http.get<OrderApiResponse[]>(`${this.ORDER_API_URL}?userId=${userId}`).pipe(
            map(responses => responses.map(response => this.convertApiResponseToOrder(response))),
            catchError(error => {
                // Handle 404 - user has no orders yet
                if (error.status === 404) {
                    console.log('[OrderService] No orders found for user');
                    return of([]);
                }
                console.error('[OrderService] Failed to fetch orders:', error);
                return of([]);
            })
        )
    }

    // get order by ID
    getOrderById(orderId: string): Observable<Order | null> {
        return this.http.get<OrderApiResponse>(`${this.ORDER_API_URL}/${orderId}`).pipe(
            map(response => this.convertApiResponseToOrder(response)),
            catchError(error => {
                console.error('[OrderService] Failed to fetch order:', error);
                return of(null);
            })
        );
    }
    
    // Update order status (optional 
    updateOrderStatus(orderId: string, status: Order['status']): Observable<Order> {
        return this.http.patch<OrderApiResponse>(`${this.ORDER_API_URL}/${orderId}`, { status }).pipe(
            map(response => this.convertApiResponseToOrder(response)),
            catchError(error => {
                console.error('[OrderService] Failed to update order status:', error);
                throw error;
            })
        );
    }

    // Convert MockAPI response to Order interface
    private convertApiResponseToOrder(response: OrderApiResponse): Order {
        return {
            id: response.id,
            userId: response.userId,
            items: JSON.parse(response.items),  // Parse JSON string to array
            subtotal: response.subtotal,
            productDiscount: response.productDiscount,
            cartLevelDiscount: response.cartLevelDiscount,
            total: response.total,
            userDetails: JSON.parse(response.userDetails),  // Parse JSON string to object
            orderDate: new Date(response.orderDate),  // Convert string to Date
            status: response.status as Order['status']
        };
    }

}