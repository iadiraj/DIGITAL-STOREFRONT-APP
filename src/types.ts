export interface User {
    id: number;
    name: string;
    email: string;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url: string;
    category: string;
    stock_quantity: number;
}

export interface CartItem {
    id: number;
    product_id: number;
    quantity: number;
}

export interface Order {
    id: number;
    total_amount: number;
    status: string;
    created_at: string;
    items?: OrderItem[];
}

export interface OrderItem {
    product_id: number;
    quantity: number;
    price: number;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}
