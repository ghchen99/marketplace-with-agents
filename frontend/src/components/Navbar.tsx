"use client";

import Link from "next/link";
import { ShoppingCart, Search, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCart, getCategories } from "@/lib/api";

export default function Navbar() {
    const [cartCount, setCartCount] = useState(0);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const router = useRouter();

    const fetchInitialData = async () => {
        try {
            const [cart, cats] = await Promise.all([getCart(), getCategories()]);
            const total = cart.reduce((acc, item) => acc + item.quantity, 0);
            setCartCount(total);
            setCategories(cats);
        } catch (err) {
            console.error("Failed to fetch initial data:", err);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        let url = `/search?`;
        if (searchQuery.trim()) url += `q=${encodeURIComponent(searchQuery.trim())}&`;
        if (selectedCategory !== "All") url += `category=${encodeURIComponent(selectedCategory)}`;
        router.push(url);
    };

    useEffect(() => {
        fetchInitialData();
        const handleCartUpdate = () => {
            getCart().then(cart => {
                const total = cart.reduce((acc, item) => acc + item.quantity, 0);
                setCartCount(total);
            });
        };
        window.addEventListener('cart-updated', handleCartUpdate);
        return () => window.removeEventListener('cart-updated', handleCartUpdate);
    }, []);

    return (
        <header className="sticky top-0 z-50">
            {/* Top Nav */}
            <nav className="bg-amazon-blue text-white px-4 py-2 flex items-center gap-4 h-16">
                <Link href="/" className="text-2xl font-bold border border-transparent hover:border-white p-2">
                    MyShop
                </Link>

                <div className="hidden md:flex flex-col border border-transparent hover:border-white p-1 px-2 cursor-pointer">
                    <span className="text-xs text-gray-300">Deliver to</span>
                    <div className="flex items-center text-sm font-bold">
                        <MapPin size={14} className="mr-1" />
                        <span>Select address</span>
                    </div>
                </div>

                {/* Search Bar Container */}
                <form
                    onSubmit={handleSearch}
                    className={`flex-1 flex h-10 rounded-md overflow-hidden transition-shadow ${isSearchFocused ? 'ring-3 ring-amazon-orange ring-offset-0' : ''}`}
                >
                    <select
                        className="bg-gray-100 text-gray-700 text-xs px-3 border-r border-gray-300 outline-none hover:bg-gray-200 cursor-pointer"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="All">All</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="Search MyShop"
                        className="flex-1 px-4 bg-white text-gray-900 outline-none placeholder:text-gray-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                    />
                    <button
                        type="submit"
                        className="bg-amazon-orange p-2 px-5 hover:bg-[#f3a847] transition-colors flex items-center justify-center"
                    >
                        <Search className="text-amazon-blue" size={22} strokeWidth={2.5} />
                    </button>
                </form>

                <div className="hidden lg:flex flex-col border border-transparent hover:border-white p-1 px-2 cursor-pointer">
                    <span className="text-xs text-gray-300">Hello, sign in</span>
                    <span className="text-sm font-bold">Account & Lists</span>
                </div>

                <Link href="/orders" className="hidden lg:flex flex-col border border-transparent hover:border-white p-1 px-2 cursor-pointer">
                    <span className="text-xs text-gray-300">Returns</span>
                    <span className="text-sm font-bold">& Orders</span>
                </Link>

                <Link href="/cart" className="flex items-end border border-transparent hover:border-white p-1 px-2 relative h-12">
                    <div className="flex items-center">
                        <div className="relative">
                            <ShoppingCart size={32} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 left-1/2 -translate-x-1/2 bg-amazon-blue text-amazon-orange font-bold text-base px-1 rounded-sm min-w-[20px] text-center">
                                    {cartCount}
                                </span>
                            )}
                        </div>
                        <span className="font-bold text-sm mt-3 ml-1 text-white">Cart</span>
                    </div>
                </Link>
            </nav>

            {/* Subnav */}
            <div className="bg-amazon-nav text-white px-4 py-1 flex items-center gap-4 text-sm font-medium">
                <button className="flex items-center font-bold hover:border border-white px-2 py-1">
                    <span className="mr-1">≡</span> All
                </button>
                <Link href="/" className="hover:border border-white px-2 py-1">Today's Deals</Link>
                <Link href="/" className="hover:border border-white px-2 py-1">Customer Service</Link>
                <Link href="/" className="hover:border border-white px-2 py-1">Registry</Link>
                <Link href="/" className="hover:border border-white px-2 py-1">Gift Cards</Link>
                <Link href="/" className="hover:border border-white px-2 py-1">Sell</Link>
            </div>
        </header>
    );
}
