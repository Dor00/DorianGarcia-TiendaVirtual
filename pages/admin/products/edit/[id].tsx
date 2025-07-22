// pages/admin/products/edit/[id].tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { withAuth } from '@/utils/withAuth';
import { supabaseBrowser } from '@/lib/supabase';

function EditProductPage() {
    const router = useRouter();
    const { id } = router.query;

    const [producto, setProducto] = useState({
        nombre: '',
        descripcion: '',
        precio: 0,
        stock: 0,
        imagen_url: '',
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchProducto = async () => {
            if (!id || typeof id !== 'string') return;
            const { data, error } = await supabaseBrowser
                .from('productos')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                setError('Error al cargar el producto');
            } else if (data) {
                setProducto(data);
            }
            setLoading(false);
        };

        fetchProducto();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProducto((prev) => ({
            ...prev,
            [name]: name === 'precio' || name === 'stock' ? parseFloat(value) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch('/api/admin/products/edit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...producto }),
            });

            if (!res.ok) {
                const { error } = await res.json();
                throw new Error(error || 'Error al actualizar');
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) {
        return <div className="p-6 text-white">Cargando producto...</div>;
    }

    if (error) {
        return <div className="p-6 text-red-500">{error}</div>;
    }

    return (
        <div className="p-6 max-w-2xl mx-auto text-white">
            <h1 className="text-2xl font-bold mb-4">Editar Producto</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    name="nombre"
                    value={producto.nombre}
                    onChange={handleChange}
                    placeholder="Nombre del producto"
                    className="w-full p-2 rounded bg-gray-700 text-white"
                    required
                />
                <textarea
                    name="descripcion"
                    value={producto.descripcion}
                    onChange={handleChange}
                    placeholder="Descripción"
                    className="w-full p-2 rounded bg-gray-700 text-white"
                    rows={4}
                />
                <input
                    name="precio"
                    type="number"
                    step="0.01"
                    value={producto.precio}
                    onChange={handleChange}
                    placeholder="Precio"
                    className="w-full p-2 rounded bg-gray-700 text-white"
                    required
                />
                <input
                    name="stock"
                    type="number"
                    value={producto.stock}
                    onChange={handleChange}
                    placeholder="Stock"
                    className="w-full p-2 rounded bg-gray-700 text-white"
                    required
                />
                <input
                    name="imagen_url"
                    value={producto.imagen_url}
                    onChange={handleChange}
                    placeholder="URL de imagen"
                    className="w-full p-2 rounded bg-gray-700 text-white"
                />

                {success && <div className="text-green-500">Producto actualizado correctamente.</div>}
                {error && <div className="text-red-500">{error}</div>}

                <div className="flex gap-4">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                        Guardar Cambios
                    </button>
                    <button
                        type="button"
                        className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded"
                        onClick={() => router.push('/admin/dashboard')}
                    >
                        Volver al Dashboard
                    </button>
                </div>
            </form>
        </div>
    );
}
export default withAuth(EditProductPage, ['admin']);