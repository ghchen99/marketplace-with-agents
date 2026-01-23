import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Navbar() {
    return (
        <nav className="bg-[#232f3e] text-white p-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold">MyShop</Link>
            <div className="space-x-4">
                <Link href="/cart">
                    <Button variant="outline" className="text-white border-white">Cart</Button>
                </Link>
            </div>
        </nav>
    );
}
