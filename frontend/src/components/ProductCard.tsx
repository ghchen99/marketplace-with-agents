import Link from "next/link";
import { ProductRead } from "@/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
    product: ProductRead;
}

export default function ProductCard({ product }: Props) {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover rounded-md" />
            </CardHeader>
            <CardContent>
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-sm text-gray-600">${product.price}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Link href={`/product/${product.id}`}>
                    <Button variant="default" size="sm">View</Button>
                </Link>
            </CardFooter>
        </Card>
    );
}
