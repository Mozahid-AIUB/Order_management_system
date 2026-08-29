// The browser calls the API directly, so this is the address as seen from
// the host machine - not the Docker service name.
const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

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

export async function updateProduct(
    id: string,
    data: Partial<{
        name: string;
        description: string;
        price: number;
        weight: number;
        isEnabled: boolean;
    }>,
) {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    return res.json();
}

export function toggleProduct(id: string, isEnabled: boolean) {
    return updateProduct(id, { isEnabled });
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

export async function getOrders() {
    const res = await fetch(`${API_BASE_URL}/orders`, {
        headers: authHeaders(),
    });
    return res.json();
}

export async function createOrder(data: any) {
    const res = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    return res.json();
}
