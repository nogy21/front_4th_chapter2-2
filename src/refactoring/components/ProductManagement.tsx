import { useState } from 'react';
import { Discount, Product } from '../../types';
import NewProductForm from './NewProductForm';
import ProductAccordion from './ProductAccordion';

interface Props {
  productList: Product[];
  onProductUpdate: (updatedProduct: Product) => void;
  onProductAdd: (newProduct: Product) => void;
}
export default function ProductManagement({ productList, onProductUpdate, onProductAdd }: Props) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newDiscount, setNewDiscount] = useState<Discount>({ quantity: 0, rate: 0 });

  const handleStockUpdate = (productId: string, newStock: number) => {
    const updatedProduct = productList.find((p) => p.id === productId);
    if (updatedProduct) {
      const newProduct = { ...updatedProduct, stock: newStock };
      onProductUpdate(newProduct);
      setEditingProduct(newProduct);
    }
  };

  const handleAddDiscount = (productId: string) => {
    const updatedProduct = productList.find((p) => p.id === productId);
    if (updatedProduct && editingProduct) {
      const newProduct = {
        ...updatedProduct,
        discounts: [...updatedProduct.discounts, newDiscount],
      };
      onProductUpdate(newProduct);
      setEditingProduct(newProduct);
      setNewDiscount({ quantity: 0, rate: 0 });
    }
  };

  const handleRemoveDiscount = (productId: string, index: number) => {
    const updatedProduct = productList.find((p) => p.id === productId);
    if (updatedProduct) {
      const newProduct = {
        ...updatedProduct,
        discounts: updatedProduct.discounts.filter((_, i) => i !== index),
      };
      onProductUpdate(newProduct);
      setEditingProduct(newProduct);
    }
  };

  // handleEditProduct 함수 수정
  const handleEditProduct = (product: Product) => {
    setEditingProduct({ ...product });
  };

  // 새로운 핸들러 함수 추가
  const handleProductNameUpdate = (productId: string, newName: string) => {
    if (editingProduct && editingProduct.id === productId) {
      const updatedProduct = { ...editingProduct, name: newName };
      setEditingProduct(updatedProduct);
    }
  };

  // 새로운 핸들러 함수 추가
  const handlePriceUpdate = (productId: string, newPrice: number) => {
    if (editingProduct && editingProduct.id === productId) {
      const updatedProduct = { ...editingProduct, price: newPrice };
      setEditingProduct(updatedProduct);
    }
  };

  // 수정 완료 핸들러 함수 추가
  const handleEditComplete = () => {
    if (editingProduct) {
      onProductUpdate(editingProduct);
      setEditingProduct(null);
    }
  };

  const getProductTitle = (product: Product) =>
    `${product.name} - ${product.price}원 (재고: ${product.stock})`;

  return (
    <div>
      <h2 className='text-2xl font-semibold mb-4'>상품 관리</h2>
      <NewProductForm onProductAdd={onProductAdd} />

      <div className='space-y-2'>
        {productList.map((product, index) => (
          <div
            key={product.id}
            data-testid={`product-${index + 1}`}
            className='bg-white p-4 rounded shadow'
          >
            <ProductAccordion id={product.id} title={getProductTitle(product)}>
              {editingProduct && editingProduct.id === product.id ? (
                <div>
                  <div className='mb-4'>
                    <label className='block mb-1'>상품명: </label>
                    <input
                      title='상품명'
                      type='text'
                      value={editingProduct.name}
                      onChange={(e) => handleProductNameUpdate(product.id, e.target.value)}
                      className='w-full p-2 border rounded'
                    />
                  </div>
                  <div className='mb-4'>
                    <label className='block mb-1'>가격: </label>
                    <input
                      title='가격'
                      type='number'
                      value={editingProduct.price}
                      onChange={(e) => handlePriceUpdate(product.id, parseInt(e.target.value))}
                      className='w-full p-2 border rounded'
                    />
                  </div>
                  <div className='mb-4'>
                    <label className='block mb-1'>재고: </label>
                    <input
                      title='재고'
                      type='number'
                      value={editingProduct.stock}
                      onChange={(e) => handleStockUpdate(product.id, parseInt(e.target.value))}
                      className='w-full p-2 border rounded'
                    />
                  </div>
                  {/* 할인 정보 수정 부분 */}
                  <div>
                    <h4 className='text-lg font-semibold mb-2'>할인 정보</h4>
                    {editingProduct.discounts.map((discount, index) => (
                      <div key={index} className='flex justify-between items-center mb-2'>
                        <span>
                          {discount.quantity}개 이상 구매 시 {discount.rate * 100}% 할인
                        </span>
                        <button
                          onClick={() => handleRemoveDiscount(product.id, index)}
                          className='bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600'
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                    <div className='flex space-x-2'>
                      <input
                        type='number'
                        placeholder='수량'
                        value={newDiscount.quantity}
                        onChange={(e) =>
                          setNewDiscount({
                            ...newDiscount,
                            quantity: parseInt(e.target.value),
                          })
                        }
                        className='w-1/3 p-2 border rounded'
                      />
                      <input
                        type='number'
                        placeholder='할인율 (%)'
                        value={newDiscount.rate * 100}
                        onChange={(e) =>
                          setNewDiscount({
                            ...newDiscount,
                            rate: parseInt(e.target.value) / 100,
                          })
                        }
                        className='w-1/3 p-2 border rounded'
                      />
                      <button
                        onClick={() => handleAddDiscount(product.id)}
                        className='w-1/3 bg-blue-500 text-white p-2 rounded hover:bg-blue-600'
                      >
                        할인 추가
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleEditComplete}
                    className='bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 mt-2'
                  >
                    수정 완료
                  </button>
                </div>
              ) : (
                <div>
                  {product.discounts.map((discount, index) => (
                    <div key={index} className='mb-2'>
                      <span>
                        {discount.quantity}개 이상 구매 시 {discount.rate * 100}% 할인
                      </span>
                    </div>
                  ))}
                  <button
                    data-testid='modify-button'
                    onClick={() => handleEditProduct(product)}
                    className='bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 mt-2'
                  >
                    수정
                  </button>
                </div>
              )}
            </ProductAccordion>
          </div>
        ))}
      </div>
    </div>
  );
}
