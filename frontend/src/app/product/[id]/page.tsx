import { getProduct } from "@/lib/api";
import AddToCartButton from "@/components/AddToCartButton";
import { Star, MapPin, ShieldCheck, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function ProductPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const product = await getProduct(params.id);

    return (
        <main className="bg-white min-h-screen">
            <div className="max-w-[1500px] mx-auto p-4 md:p-8">
                <nav className="flex items-center text-xs text-gray-500 mb-6 gap-1">
                    <Link href="/" className="hover:underline">Home</Link>
                    <ChevronRight size={12} />
                    <span className="hover:underline cursor-pointer">{product.category}</span>
                </nav>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left: Image */}
                    <div className="w-full lg:w-[40%] flex flex-col items-center">
                        <div className="sticky top-24 w-full aspect-square bg-white flex items-center justify-center border border-gray-100 rounded-md p-4">
                            <img
                                src={product.image_url}
                                alt={product.name}
                                className="max-h-full max-w-full object-contain mix-blend-multiply"
                            />
                        </div>
                    </div>

                    {/* Center: Info */}
                    <div className="flex-1 space-y-4">
                        <div className="border-b border-gray-200 pb-4">
                            <h1 className="text-2xl md:text-3xl font-medium text-gray-900 leading-tight mb-2">
                                {product.name}
                            </h1>
                            <Link href="/" className="text-sm font-medium text-amazon-link hover:underline hover:text-[#c45500]">
                                Brand: MyShop Original
                            </Link>

                            <div className="flex items-center mt-2 gap-4">
                                <div className="flex items-center text-amazon-orange">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={18} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} strokeWidth={1.5} />
                                    ))}
                                    <span className="text-sm font-medium text-amazon-link ml-2 hover:text-[#c45500] hover:underline">
                                        {product.rating} out of 5 stars
                                    </span>
                                </div>
                                <span className="text-sm text-amazon-link hover:text-[#c45500] hover:underline">
                                    {product.review_count.toLocaleString()} ratings
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-medium self-start mt-1">$</span>
                                <span className="text-3xl font-medium">{(product.price / 100).toFixed(0)}</span>
                                <span className="text-sm font-medium self-start mt-1">{(product.price % 100).toString().padStart(2, '0')}</span>
                            </div>

                            <p className="text-sm text-gray-700">
                                <strong>Returns:</strong> <span className="text-amazon-link hover:underline cursor-pointer">Eligible for Return, Refund or Replacement within 30 days of receipt</span>
                            </p>

                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="font-bold text-sm mb-2">About this item</h3>
                                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                                    {product.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Buy Box */}
                    <div className="w-full lg:w-[250px] xl:w-[300px]">
                        <div className="border border-gray-300 rounded-lg p-5 space-y-4 sticky top-24">
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-medium self-start mt-0.5">$</span>
                                <span className="text-2xl font-medium">{(product.price / 100).toFixed(2)}</span>
                            </div>

                            <div className="text-sm">
                                <p className="text-amazon-link hover:underline cursor-pointer">FREE Returns</p>
                                <p className="mt-2 text-[#007600] font-medium">In Stock</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-start gap-2 text-xs">
                                    <MapPin size={16} className="text-gray-600 mt-1 shrink-0" />
                                    <p className="text-amazon-link hover:underline cursor-pointer">Deliver to Select address</p>
                                </div>

                                <AddToCartButton product={product} />

                                <button className="w-full bg-amazon-orange hover:bg-[#e47911] text-gray-900 py-3 rounded-full font-medium shadow-sm transition-colors border border-[#a88734]">
                                    Buy Now
                                </button>
                            </div>

                            <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Ships from</span>
                                    <span>MyShop.com</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Sold by</span>
                                    <span>MyShop.com</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Returns</span>
                                    <span className="text-amazon-link hover:underline cursor-pointer">Eligible for Return</span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-gray-200">
                                <div className="flex items-start gap-2 text-sm text-amazon-link hover:underline cursor-pointer">
                                    <ShieldCheck size={20} className="text-gray-500 shrink-0" />
                                    <span>Payment Secure transaction</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
