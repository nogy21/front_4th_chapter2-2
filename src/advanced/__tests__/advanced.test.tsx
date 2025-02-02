/* eslint-disable sonarjs/no-nested-functions */
import { act, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, test } from 'vitest';
import InvalidQuantityError from '../../refactoring/errors/InvalidQuantityError';
import { useCart } from '../../refactoring/hooks/useCart';
import * as cartEntity from '../../refactoring/models/cart';
import { AdminPage } from '../../refactoring/pages/AdminPage';
import { CartPage } from '../../refactoring/pages/CartPage';
import { fromPercentage, isNegativeNumber, updateKey } from '../../refactoring/utils';
import { CartItem, Coupon, Product } from '../../types';

const mockProductList: Product[] = [
  {
    id: 'p1',
    name: '상품1',
    price: 10000,
    stock: 20,
    discounts: [{ quantity: 10, rate: 0.1 }],
  },
  {
    id: 'p2',
    name: '상품2',
    price: 20000,
    stock: 20,
    discounts: [{ quantity: 10, rate: 0.15 }],
  },
  {
    id: 'p3',
    name: '상품3',
    price: 30000,
    stock: 20,
    discounts: [{ quantity: 10, rate: 0.2 }],
  },
];
const mockCoupons: Coupon[] = [
  {
    name: '5000원 할인 쿠폰',
    code: 'AMOUNT5000',
    discountType: 'amount',
    discountValue: 5000,
  },
  {
    name: '10% 할인 쿠폰',
    code: 'PERCENT10',
    discountType: 'percentage',
    discountValue: 10,
  },
];

const TestAdminPage = () => {
  const [productList, setProductList] = useState<Product[]>(mockProductList);
  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);

  const handleProductUpdate = (updatedProduct: Product) => {
    setProductList((prevProductList) =>
      prevProductList.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)),
    );
  };

  const handleProductAdd = (newProduct: Product) => {
    setProductList((prevProductList) => [...prevProductList, newProduct]);
  };

  const handleCouponAdd = (newCoupon: Coupon) => {
    setCoupons((prevCoupons) => [...prevCoupons, newCoupon]);
  };

  return (
    <AdminPage
      productList={productList}
      coupons={coupons}
      onProductUpdate={handleProductUpdate}
      onProductAdd={handleProductAdd}
      onCouponAdd={handleCouponAdd}
    />
  );
};

describe('advanced > ', () => {
  describe('시나리오 테스트 > ', () => {
    test('장바구니 페이지 테스트 > ', async () => {
      render(<CartPage productList={mockProductList} coupons={mockCoupons} />);
      const product1 = screen.getByTestId('product-p1');
      const product2 = screen.getByTestId('product-p2');
      const product3 = screen.getByTestId('product-p3');
      const addToCartButtonsAtProduct1 = within(product1).getByText('장바구니에 추가');
      const addToCartButtonsAtProduct2 = within(product2).getByText('장바구니에 추가');
      const addToCartButtonsAtProduct3 = within(product3).getByText('장바구니에 추가');

      // 1. 상품 정보 표시
      expect(product1).toHaveTextContent('상품1');
      expect(product1).toHaveTextContent('10,000원');
      expect(product1).toHaveTextContent('재고: 20개');
      expect(product2).toHaveTextContent('상품2');
      expect(product2).toHaveTextContent('20,000원');
      expect(product2).toHaveTextContent('재고: 20개');
      expect(product3).toHaveTextContent('상품3');
      expect(product3).toHaveTextContent('30,000원');
      expect(product3).toHaveTextContent('재고: 20개');

      // 2. 할인 정보 표시
      expect(screen.getByText('10개 이상: 10% 할인')).toBeInTheDocument();

      // 3. 상품1 장바구니에 상품 추가
      fireEvent.click(addToCartButtonsAtProduct1); // 상품1 추가

      // 4. 할인율 계산
      expect(screen.getByText('상품 금액: 10,000원')).toBeInTheDocument();
      expect(screen.getByText('할인 금액: 0원')).toBeInTheDocument();
      expect(screen.getByText('최종 결제 금액: 10,000원')).toBeInTheDocument();

      // 5. 상품 품절 상태로 만들기
      for (let i = 0; i < 19; i++) {
        fireEvent.click(addToCartButtonsAtProduct1);
      }

      // 6. 품절일 때 상품 추가 안 되는지 확인하기
      expect(product1).toHaveTextContent('재고: 0개');
      fireEvent.click(addToCartButtonsAtProduct1);
      expect(product1).toHaveTextContent('재고: 0개');

      // 7. 할인율 계산
      expect(screen.getByText('상품 금액: 200,000원')).toBeInTheDocument();
      expect(screen.getByText('할인 금액: 20,000원')).toBeInTheDocument();
      expect(screen.getByText('최종 결제 금액: 180,000원')).toBeInTheDocument();

      // 8. 상품을 각각 10개씩 추가하기
      fireEvent.click(addToCartButtonsAtProduct2); // 상품2 추가
      fireEvent.click(addToCartButtonsAtProduct3); // 상품3 추가

      const increaseButtons = screen.getAllByText('+');
      for (let i = 0; i < 9; i++) {
        fireEvent.click(increaseButtons[1]); // 상품2
        fireEvent.click(increaseButtons[2]); // 상품3
      }

      // 9. 할인율 계산
      expect(screen.getByText('상품 금액: 700,000원')).toBeInTheDocument();
      expect(screen.getByText('할인 금액: 110,000원')).toBeInTheDocument();
      expect(screen.getByText('최종 결제 금액: 590,000원')).toBeInTheDocument();

      // 10. 쿠폰 적용하기
      const couponSelect = screen.getByRole('combobox');
      fireEvent.change(couponSelect, { target: { value: '1' } }); // 10% 할인 쿠폰 선택

      // 11. 할인율 계산
      expect(screen.getByText('상품 금액: 700,000원')).toBeInTheDocument();
      expect(screen.getByText('할인 금액: 169,000원')).toBeInTheDocument();
      expect(screen.getByText('최종 결제 금액: 531,000원')).toBeInTheDocument();

      // 12. 다른 할인 쿠폰 적용하기
      fireEvent.change(couponSelect, { target: { value: '0' } }); // 5000원 할인 쿠폰
      expect(screen.getByText('상품 금액: 700,000원')).toBeInTheDocument();
      expect(screen.getByText('할인 금액: 115,000원')).toBeInTheDocument();
      expect(screen.getByText('최종 결제 금액: 585,000원')).toBeInTheDocument();
    });

    test('관리자 페이지 테스트 > ', async () => {
      render(<TestAdminPage />);

      const $product1 = screen.getByTestId('product-1');

      // 1. 새로운 상품 추가
      fireEvent.click(screen.getByText('새 상품 추가'));

      fireEvent.change(screen.getByLabelText('상품명'), { target: { value: '상품4' } });
      fireEvent.change(screen.getByLabelText('가격'), { target: { value: '15000' } });
      fireEvent.change(screen.getByLabelText('재고'), { target: { value: '30' } });

      fireEvent.click(screen.getByText('추가'));

      const $product4 = screen.getByTestId('product-4');

      expect($product4).toHaveTextContent('상품4');
      expect($product4).toHaveTextContent('15000원');
      expect($product4).toHaveTextContent('재고: 30');

      // 2. 상품 선택 및 수정
      fireEvent.click($product1);
      fireEvent.click(within($product1).getByTestId('toggle-button'));
      fireEvent.click(within($product1).getByTestId('modify-button'));

      act(() => {
        fireEvent.change(within($product1).getByDisplayValue('20'), { target: { value: '25' } });
        fireEvent.change(within($product1).getByDisplayValue('10000'), {
          target: { value: '12000' },
        });
        fireEvent.change(within($product1).getByDisplayValue('상품1'), {
          target: { value: '수정된 상품1' },
        });
      });

      fireEvent.click(within($product1).getByText('수정 완료'));

      expect($product1).toHaveTextContent('수정된 상품1');
      expect($product1).toHaveTextContent('12000원');
      expect($product1).toHaveTextContent('재고: 25');

      // 3. 상품 할인율 추가 및 삭제
      fireEvent.click($product1);
      fireEvent.click(within($product1).getByTestId('modify-button'));

      // 할인 추가
      act(() => {
        fireEvent.change(screen.getByPlaceholderText('수량'), { target: { value: '5' } });
        fireEvent.change(screen.getByPlaceholderText('할인율 (%)'), { target: { value: '5' } });
      });
      fireEvent.click(screen.getByText('할인 추가'));

      expect(screen.queryByText('5개 이상 구매 시 5% 할인')).toBeInTheDocument();

      // 할인 삭제
      fireEvent.click(screen.getAllByText('삭제')[0]);
      expect(screen.queryByText('10개 이상 구매 시 10% 할인')).not.toBeInTheDocument();
      expect(screen.queryByText('5개 이상 구매 시 5% 할인')).toBeInTheDocument();

      fireEvent.click(screen.getAllByText('삭제')[0]);
      expect(screen.queryByText('10개 이상 구매 시 10% 할인')).not.toBeInTheDocument();
      expect(screen.queryByText('5개 이상 구매 시 5% 할인')).not.toBeInTheDocument();

      // 4. 쿠폰 추가
      fireEvent.change(screen.getByPlaceholderText('쿠폰 이름'), { target: { value: '새 쿠폰' } });
      fireEvent.change(screen.getByPlaceholderText('쿠폰 코드'), { target: { value: 'NEW10' } });
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'percentage' } });
      fireEvent.change(screen.getByPlaceholderText('할인 값'), { target: { value: '10' } });

      fireEvent.click(screen.getByText('쿠폰 추가'));

      const $newCoupon = screen.getByTestId('coupon-3');

      expect($newCoupon).toHaveTextContent('새 쿠폰 (NEW10):10% 할인');
    });
  });

  describe('순수 함수 > ', () => {
    describe('fromPercentage > ', () => {
      test('백분율을 소수로 변환해야 합니다.', () => {
        expect(fromPercentage(10)).toBe(0.1);
        expect(fromPercentage(50)).toBe(0.5);
        expect(fromPercentage(100)).toBe(1);
      });

      test('0%는 0으로 변환해야 합니다.', () => {
        expect(fromPercentage(0)).toBe(0);
      });

      test('음수 백분율도 소수로 변환해야 합니다.', () => {
        expect(() => fromPercentage(-10)).toThrowError('백분율은 0 이상의 숫자여야 합니다.');
      });
    });

    describe('isPositive > ', () => {
      test('음수일 때 true를 반환해야 합니다.', () => {
        expect(isNegativeNumber(-1)).toBe(true);
        expect(isNegativeNumber(-100)).toBe(true);
      });

      test('양수일 때 false를 반환해야 합니다.', () => {
        expect(isNegativeNumber(1)).toBe(false);
        expect(isNegativeNumber(100)).toBe(false);
      });

      test('0일 때 false를 반환해야 합니다.', () => {
        expect(isNegativeNumber(0)).toBe(false);
      });
    });

    describe('updateKey > ', () => {
      test('객체의 특정 키의 값을 업데이트해야 합니다.', () => {
        const obj = { a: 1, b: 2, c: 3 };
        expect(updateKey(obj, 'b', 10)).toEqual({ a: 1, b: 10, c: 3 });
      });

      test('원본 객체를 변경하지 않아야 합니다.', () => {
        const obj = { a: 1, b: 2, c: 3 };
        updateKey(obj, 'b', 10);
        expect(obj).toEqual({ a: 1, b: 2, c: 3 });
      });
    });

    describe('cart > ', () => {
      describe('calculateItemTotal >', () => {
        test('할인이 없는 상품은 정가로 계산되어야 합니다.', () => {
          const item: CartItem = {
            product: {
              id: 'p1',
              name: '상품1',
              price: 2000,
              stock: 10,
              discounts: [],
            },
            quantity: 2,
          };
          expect(cartEntity.calculateItemTotal(item)).toBe(4000); // 2000 * 2
        });

        test('수량별 할인이 적용되어야 합니다.', () => {
          const item: CartItem = {
            product: {
              id: 'p1',
              name: '상품1',
              price: 1000,
              stock: 10,
              discounts: [
                {
                  quantity: 2,
                  rate: 0.1,
                },
              ],
            },
            quantity: 2,
          };
          expect(cartEntity.calculateItemTotal(item)).toBe(1800); // (1000 * 2) * 0.9
        });

        test('여러 할인 중 최대 할인이 적용되어야 합니다.', () => {
          const item: CartItem = {
            product: {
              id: 'p1',
              name: '상품1',
              price: 1000,
              stock: 10,
              discounts: [
                {
                  quantity: 2,
                  rate: 0.1,
                },
                {
                  quantity: 3,
                  rate: 0.2,
                },
                {
                  quantity: 4,
                  rate: 0.3,
                },
                {
                  quantity: 5,
                  rate: 0.4,
                },
              ],
            },
            quantity: 8,
          };
          expect(cartEntity.calculateItemTotal(item)).toBe(1000 * 8 * 0.6);
        });

        test('할인 조건을 만족하지 않으면 정가로 계산되어야 합니다.', () => {
          const item: CartItem = {
            product: {
              id: 'p1',
              name: '상품1',
              price: 1000,
              stock: 10,
              discounts: [
                {
                  quantity: 2,
                  rate: 0.1,
                },
              ],
            },
            quantity: 1,
          };
          expect(cartEntity.calculateItemTotal(item)).toBe(1000);
        });
      });

      describe('getMaxApplicableDiscount >', () => {
        test('적용 가능한 할인이 없으면 0을 반환해야 합니다.', () => {
          const item: CartItem = {
            product: {
              id: 'p1',
              name: '상품1',
              price: 1000,
              stock: 10,
              discounts: [
                {
                  quantity: 2,
                  rate: 0.1,
                },
              ],
            },
            quantity: 1,
          };
          expect(cartEntity.getMaxApplicableDiscount(item)).toBe(0);
        });

        test('여러 할인 중 최대 할인율을 반환해야 합니다.', () => {
          const item: CartItem = {
            product: {
              id: 'p1',
              name: '상품1',
              price: 1000,
              stock: 10,
              discounts: [
                {
                  quantity: 2,
                  rate: 0.1,
                },
                {
                  quantity: 3,
                  rate: 0.2,
                },
                {
                  quantity: 4,
                  rate: 0.3,
                },
                {
                  quantity: 5,
                  rate: 0.4,
                },
              ],
            },
            quantity: 3,
          };
          expect(cartEntity.getMaxApplicableDiscount(item)).toBe(0.2);
        });

        test('할인이 없는 상품은 0을 반환해야 합니다.', () => {
          const item: CartItem = {
            product: {
              id: 'p1',
              name: '상품1',
              price: 1000,
              stock: 10,
              discounts: [],
            },
            quantity: 5,
          };
          expect(cartEntity.getMaxApplicableDiscount(item)).toBe(0);
        });
      });

      describe('calculateCartTotal >', () => {
        const cart: CartItem[] = [
          {
            product: {
              id: 'p1',
              name: '상품1',
              price: 1000,
              stock: 10,
              discounts: [
                {
                  quantity: 2,
                  rate: 0.2,
                },
              ],
            },
            quantity: 3,
          }, // 1000 * 3 * 0.8 = 2400
          {
            product: {
              id: 'p2',
              name: '상품2',
              price: 2000,
              stock: 10,
              discounts: [
                {
                  quantity: 2,
                  rate: 0.1,
                },
              ],
            },
            quantity: 2,
          }, // 2000 * 2 * 0.9 = 3600
        ];

        test('쿠폰 없이 계산되어야 합니다.', () => {
          const result = cartEntity.calculateCartTotal(cart, null);
          expect(result.totalBeforeDiscount).toBe(3000 + 4000);
          expect(result.totalAfterDiscount).toBe(2400 + 3600);
          expect(result.totalDiscount).toBe(1000);
        });

        test('정액 쿠폰이 적용되어야 합니다.', () => {
          const coupon: Coupon = {
            name: '1000원 할인',
            code: 'FIXED1000',
            discountType: 'amount',
            discountValue: 1000,
          };
          const result = cartEntity.calculateCartTotal(cart, coupon);
          expect(result.totalAfterDiscount).toBe(2400 + 3600 - 1000);
          expect(result.totalDiscount).toBe(7000 - (2400 + 3600 - 1000));
        });

        test('퍼센트 쿠폰이 적용되어야 합니다.', () => {
          const coupon: Coupon = {
            name: '10% 할인',
            code: 'PERCENT10',
            discountType: 'percentage',
            discountValue: 10,
          };
          const result = cartEntity.calculateCartTotal(cart, coupon);
          expect(result.totalAfterDiscount).toBe((2400 + 3600) * 0.9);
          expect(result.totalDiscount).toBe(7000 - (2400 + 3600) * 0.9);
        });

        test('빈 카트는 0으로 계산되어야 합니다.', () => {
          const result = cartEntity.calculateCartTotal([], null);
          expect(result).toEqual(cartEntity.getDefaultCartTotal());
        });
      });
    });
  });

  describe('커스텀 훅 > ', () => {
    describe('useCart > ', () => {
      describe('카트에 상품 추가 > ', () => {
        test('새로운 상품을 카트에 추가할 수 있습니다.', () => {
          const { result } = renderHook(() => useCart());

          act(() => {
            result.current.addToCart(mockProductList[0]);
          });

          expect(result.current.cart).toHaveLength(1);
          expect(result.current.cart[0].product.id).toBe(mockProductList[0].id);
          expect(result.current.cart[0].quantity).toBe(1);
        });

        test('이미 있는 상품을 추가하면 수량이 증가합니다.', () => {
          const { result } = renderHook(() => useCart());

          act(() => {
            result.current.addToCart(mockProductList[0]);
            result.current.addToCart(mockProductList[0]);
          });

          expect(result.current.cart).toHaveLength(1);
          expect(result.current.cart[0].quantity).toBe(2);
        });

        test('다른 상품을 추가하면 새로운 아이템이 추가됩니다.', () => {
          const { result } = renderHook(() => useCart());

          act(() => {
            result.current.addToCart(mockProductList[0]);
            result.current.addToCart(mockProductList[1]);
          });

          expect(result.current.cart).toHaveLength(2);
        });
      });

      describe('카트에서 상품 제거 > ', () => {
        test('상품을 카트에서 제거할 수 있습니다.', () => {
          const { result } = renderHook(() => useCart());

          act(() => {
            result.current.addToCart(mockProductList[0]);
            result.current.addToCart(mockProductList[1]);
            result.current.removeFromCart(mockProductList[0].id);
          });

          expect(result.current.cart).toHaveLength(1);
          expect(result.current.cart[0].product.id).toBe(mockProductList[1].id);
        });

        test('존재하지 않는 상품을 제거하려고 해도 에러가 발생하지 않습니다.', () => {
          const { result } = renderHook(() => useCart());

          act(() => {
            result.current.addToCart(mockProductList[0]);
            result.current.removeFromCart('non-existent-id');
          });

          expect(result.current.cart).toHaveLength(1);
        });
      });

      describe('카트 수량 업데이트 > ', () => {
        test('상품 수량을 업데이트해야 합니다.', () => {
          const { result } = renderHook(() => useCart());

          const cartItem: CartItem = {
            product: mockProductList[0],
            quantity: 1,
          };
          act(() => {
            result.current.addToCart(cartItem.product);
            result.current.updateQuantity(cartItem.product.id, 5);
          });

          expect(result.current.cart[0].quantity).toBe(5);
        });

        test('상품 수량을 유효하지 않은 값으로 업데이트 할 수 없습니다.', () => {
          const { result } = renderHook(() => useCart());

          const cartItem: CartItem = {
            product: mockProductList[0],
            quantity: 1,
          };
          try {
            act(() => {
              result.current.updateQuantity(cartItem.product.id, -5);
            });
          } catch (error) {
            expect(error).toBeInstanceOf(InvalidQuantityError);
          }

          try {
            act(() => {
              result.current.updateQuantity(cartItem.product.id, '5' as any);
            });
          } catch (error) {
            expect(error).toBeInstanceOf(InvalidQuantityError);
          }
        });
      });

      describe('카트 총액 계산 > ', () => {
        test('빈 카트의 경우 기본값을 반환합니다.', () => {
          const { result } = renderHook(() => useCart());

          const total = result.current.calculateTotal();
          expect(total).toEqual({
            totalBeforeDiscount: 0,
            totalAfterDiscount: 0,
            totalDiscount: 0,
          });
        });

        test('할인이 없는 상품의 경우 정가로 계산됩니다.', () => {
          const { result } = renderHook(() => useCart());
          const withoutDiscount = {
            id: 'p1',
            price: 2000,
            discounts: [
              {
                quantity: 0,
                rate: 0,
              },
            ],
            stock: 10,
            name: '상품',
          };

          act(() => {
            result.current.addToCart(withoutDiscount);
          });

          const total = result.current.calculateTotal();
          expect(total.totalBeforeDiscount).toBe(2000);
          expect(total.totalAfterDiscount).toBe(2000);
          expect(total.totalDiscount).toBe(0);
        });

        test('수량 할인이 적용된 상품이 올바르게 계산됩니다.', () => {
          const { result } = renderHook(() => useCart());
          const product1 = {
            id: 'p1',
            price: 1000,
            discounts: [
              {
                quantity: 1,
                rate: 0.1,
              },
            ],
            stock: 2,
            name: '상품1',
          };
          const product2 = {
            id: 'p2',
            price: 1000,
            discounts: [
              {
                quantity: 1,
                rate: 0.1,
              },
            ],
            stock: 10,
            name: '상품2',
          };

          act(() => {
            result.current.addToCart(product1); // 1000원 상품
            result.current.addToCart(product2); // 1000원 상품
          });

          const total = result.current.calculateTotal();
          expect(total.totalBeforeDiscount).toBe(2000); // 1000 * 2
          expect(total.totalAfterDiscount).toBe(1800); // 2000 * 0.9
          expect(total.totalDiscount).toBe(200);
        });
      });
    });
  });
});
