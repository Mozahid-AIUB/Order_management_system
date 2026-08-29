const API_BASE_URL = 'http://localhost:3000';

export async function loginRequest(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        throw new Error('Invalid email or password');
    }

    return response.json();
}

function authHeaders() {
    const token = localStorage.getItem("accessToken");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function getProducts() {
    const res = await fetch(`${API_BASE_URL}/products`, {
        headers: authHeaders(),
    });
    return res.json();
}

export async function createProduct(data: {
    name: string;
    description?: string;
    price: number;
    weight: number;
}) {
    const res = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function toggleProduct(id: string, isEnabled: boolean) {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ isEnabled }),
    });
    return res.json();
}

export async function getPromotions() {
    const res = await fetch(`${API_BASE_URL}/promotions`, {
        headers: authHeaders(),
    });
    return res.json();
}

export async function createPromotion(data: any) {
    const res = await fetch(`${API_BASE_URL}/promotions`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function updatePromotion(id: string, data: any) {
    const res = await fetch(`${API_BASE_URL}/promotions/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    return res.json();
}

