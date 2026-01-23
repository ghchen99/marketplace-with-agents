import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Search, MapPin } from "lucide-react";

export default function Navbar() {
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

                <div className="flex-1 flex h-10">
                    <select className="bg-gray-100 text-gray-700 text-xs px-2 rounded-l-md border-r border-gray-300 outline-none hover:bg-gray-200">
                        <option>All</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Search MyShop"
                        className="flex-1 px-4 text-black outline-none focus:ring-2 focus:ring-amazon-orange"
                    />
                    <button className="bg-amazon-orange p-2 px-4 rounded-r-md hover:bg-[#f3a847] transition-colors">
                        <Search className="text-amazon-blue" size={24} />
                    </button>
                </div>

                <div className="hidden lg:flex flex-col border border-transparent hover:border-white p-1 px-2 cursor-pointer">
                    <span className="text-xs text-gray-300">Hello, sign in</span>
                    <span className="text-sm font-bold">Account & Lists</span>
                </div>

                <div className="hidden lg:flex flex-col border border-transparent hover:border-white p-1 px-2 cursor-pointer">
                    <span className="text-xs text-gray-300">Returns</span>
                    <span className="text-sm font-bold">& Orders</span>
                </div>

                <Link href="/cart" className="flex items-end border border-transparent hover:border-white p-1 px-2 relative">
                    <div className="flex items-center">
                        <div className="relative">
                            <ShoppingCart size={32} />
                            <span className="absolute -top-1 right-2 text-amazon-orange font-bold text-lg">0</span>
                        </div>
                        <span className="font-bold text-sm mt-3 ml-1">Cart</span>
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
