import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, map, catchError, delay } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { HttpClient } from '@angular/common/http';
import { StockUpdateRequest } from '../models/cart.model';
@Injectable({
  providedIn: 'root',
})
export class ProductData {
  // private readonly API_URL = ;

  // Mock data for testing
  private readonly MOCK_PRODUCTS: Product[] =
    [
      // {
      //   "id": "p1",
      //   "name": "Samsung Galaxy S23",
      //   "image": "https://images.unsplash.com/photo-1675861479470-1b7d2c3e5d3a?auto=format&w=400&q=80",
      //   "category": "Electronics",
      //   "price": 74999,
      //   "discount": 12,
      //   "stock": 0,
      //   "description": "Flagship smartphone with Snapdragon 8 Gen 2, 256GB storage, and 120Hz AMOLED display."
      // },
      // {
      //   "id": "p2",
      //   "name": "Sony WH-1000XM5 Headphones",
      //   "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&w=400&q=80",
      //   "category": "Electronics",
      //   "price": 29999,
      //   "discount": 8,
      //   "stock": 25,
      //   "description": "Premium wireless headphones with industry-leading noise cancellation and 30-hour battery life."
      // },
      // {
      //   "id": "p3",
      //   "name": "Levi's Classic Denim Jacket",
      //   "image": "https://images.unsplash.com/photo-1523205771623-e0faa4d2813d?auto=format&w=400&q=80",
      //   "category": "Clothing",
      //   "price": 4999,
      //   "stock": 40,
      //   "description": "Vintage-style denim jacket with modern fit, perfect for casual wear."
      // },
      // {
      //   "id": "p4",
      //   "name": "Prestige Coffee Maker",
      //   "image": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&w=400&q=80",
      //   "category": "Home",
      //   "price": 3499,
      //   "discount": 15,
      //   "stock": 12,
      //   "description": "Automatic drip coffee maker with programmable timer and reusable filter."
      // },
      // {
      //   "id": "p5",
      //   "name": "Ray-Ban Aviator Sunglasses",
      //   "image": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&w=400&q=80",
      //   "category": "Accessories",
      //   "price": 8999,
      //   "stock": 20,
      //   "description": "Classic aviator sunglasses with UV protection and lightweight metal frame."
      // },
      // {
      //   "id": "p6",
      //   "name": "The Alchemist - Paulo Coelho",
      //   "image": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&w=400&q=80",
      //   "category": "Books",
      //   "price": 399,
      //   "stock": 100,
      //   "description": "International bestselling novel about following your dreams and listening to your heart."
      // },
      // {
      //   "id": "p7",
      //   "name": "Nike Air Zoom Pegasus 40",
      //   "image": "https://images.unsplash.com/photo-1600180758895-3e6a3f2f0d3a?auto=format&w=400&q=80",
      //   "category": "Sports",
      //   "price": 10999,
      //   "discount": 5,
      //   "stock": 35,
      //   "description": "Lightweight running shoes with responsive cushioning and breathable mesh upper."
      // },
      // {
      //   "id": "p8",
      //   "name": "Apple MacBook Air M2",
      //   "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&w=400&q=80",
      //   "category": "Electronics",
      //   "price": 114999,
      //   "stock": 10,
      //   "description": "Ultra-thin laptop powered by Apple M2 chip with 13.6-inch Retina display."
      // },
      // {
      //   "id": "p9",
      //   "name": "Lakmé Matte Lipstick",
      //   "image": "https://images.unsplash.com/photo-1600180758895-3e6a3f2f0d3a?auto=format&w=400&q=80",
      //   "category": "Beauty",
      //   "price": 499,
      //   "discount": 20,
      //   "stock": 200,
      //   "description": "Long-lasting matte lipstick available in multiple shades."
      // },
      // {
      //   "id": "p10",
      //   "name": "Philips LED Smart Bulb",
      //   "image": "https://images.unsplash.com/photo-1582719478250-9a6b5f2f0d3a?auto=format&w=400&q=80",
      //   "category": "Home",
      //   "price": 799,
      //   "stock": 0,
      //   "description": "Smart LED bulb with Wi-Fi connectivity, supports Alexa and Google Assistant."
      // }
    ];

  constructor(private http: HttpClient) {}

  // Fetch all products from API
  
  getProducts(): Observable<Product[]> {
    // console.log('[ProductData] Fetching products...');

    return this.http.get<Product[]>('https://6923ed873ad095fb84720c57.mockapi.io/data/productdata').pipe(
      tap(products => console.log(`[getProducts API] Fetched ${products.length} products`)),
      catchError(error => {
        console.error('[getProducts API] API error, using mock data:', error);
        // Return mock data with simulated network delay to keep behavior consistent
        return of(this.MOCK_PRODUCTS).pipe(
          delay(500),
          tap(products => console.log(`[getProducts API] Loaded ${products.length} products (mock)`))
        );
      })
    );
  }

  // Get products filtered by category
  getProductsByCategory(category: string): Observable<Product[]> {
    // console.log(`[ProductData] Fetching products for category: ${category}`);

    // return this.getProducts().pipe(
    //   map(products => {
    //     const filtered = products.filter(p =>
    //       p.category.toLowerCase() === category.toLowerCase()
    //     );
    //     // console.log(`[ProductData] Found ${filtered.length} products in ${category}`);
    //     return filtered;
    //   })
    // );

    return this.http.get<Product[]>(`https://6923ed873ad095fb84720c57.mockapi.io/data/productdata?category=${category}`).pipe(
      tap( product => {
        console.log(`[getProductsByCategory API] Fetched products for category ${category}:`, product.length);
      }),
      catchError( error => {
        console.error(`[getProductsByCategory API] Failed to fetch products for category ${category}:`, error);
        return of([]);
      })
    )

    return this.http.get<Product[]>(``)
  }

  // Get a single product by ID
   
  getProductById(id: string): Observable<Product | undefined> {
    // console.log(`[ProductData] Fetching product: ${id}`);
    return this.http.get<Product>(`https://6923ed873ad095fb84720c57.mockapi.io/data/productdata/${id}`).pipe(
      tap(product => {
        console.log(`[getProductById API] Product ${id}:`, product ? 'found' : 'not found');
      }),
      catchError(error => {
        console.error(`[getProductById API] Failed to fetch product ${id}:`, error);
        return of(undefined);
      })
    )
  }

  // update product stock after checkout
  updateProductStock(id: string,newStock: number) : Observable<Product | undefined> {
    const body: StockUpdateRequest = { stock : newStock}
    return this.http.put<Product>(`https://6923ed873ad095fb84720c57.mockapi.io/data/productdata/${id}`, body).pipe(
      tap(product => {
        console.log(`[updateProductStock API] Updated stock for product ${id}:`, product);
      }),
      catchError(error => {
        console.error(`[updateProductStock API] Failed to update stock for product ${id}:`, error);
        throw error;
      })
    )
  }

}
