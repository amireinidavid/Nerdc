import { Request, Response, NextFunction } from "express";
import { prisma } from "../server";
import { handleErrorResponse } from "../utils/errorHandler";

/**
 * Get the active cart for the current user
 */
export const getUserCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Please login to access your cart",
      });
    }

    // Find active cart or create a new one
    let cart = await prisma.cart.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
      include: {
        items: {
          include: {
            journal: {
              select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                abstract: true,
                price: true,
                categoryId: true,
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      // Create a new cart if no active cart exists
      cart = await prisma.cart.create({
        data: {
          userId,
          status: "ACTIVE",
          totalAmount: 0,
        },
        include: {
          items: {
            include: {
              journal: {
                select: {
                  id: true,
                  title: true,
                  thumbnailUrl: true,
                  abstract: true,
                  price: true,
                  categoryId: true,
                  category: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart retrieved successfully",
      cart,
    });
  } catch (error) {
    return handleErrorResponse(error, res, "Error retrieving cart");
  }
};

/**
 * Add a journal to the user's cart
 */
export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Please login to add items to cart",
      });
    }

    const { journalId } = req.body;
    if (!journalId) {
      return res.status(400).json({
        success: false,
        message: "Journal ID is required",
      });
    }

    // Verify journal exists and is published
    const journal = await prisma.journal.findFirst({
      where: {
        id: parseInt(journalId),
        isPublished: true,
        reviewStatus: "PUBLISHED",
      },
    });

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: "Journal not found or not available for purchase",
      });
    }

    // Set fixed price of 10,000 for journals
    const journalPrice = 10000;

    // Find or create active cart
    let cart = await prisma.cart.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          status: "ACTIVE",
          totalAmount: journalPrice,
        },
      });
    } else {
      // Check if journal already in cart
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          journalId: journal.id,
        },
      });

      if (existingItem) {
        return res.status(409).json({
          success: false,
          message: "Journal already in cart",
        });
      }
    }

    // Add item to cart
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        journalId: journal.id,
        price: journalPrice,
      },
    });

    // Update cart total
    const cartItems = await prisma.cartItem.findMany({
      where: {
        cartId: cart.id,
      },
    });

    // Calculate new total (sum of all items)
    const newTotal = cartItems.reduce(
      (sum: number, item: any) => sum + parseFloat(item.price.toString()),
      0
    );

    // Update cart total
    await prisma.cart.update({
      where: {
        id: cart.id,
      },
      data: {
        totalAmount: newTotal,
      },
    });

    // Get updated cart with items
    const updatedCart = await prisma.cart.findUnique({
      where: {
        id: cart.id,
      },
      include: {
        items: {
          include: {
            journal: {
              select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                abstract: true,
                price: true,
                categoryId: true,
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Journal added to cart successfully",
      cart: updatedCart,
    });
  } catch (error) {
    return handleErrorResponse(error, res, "Error adding journal to cart");
  }
};

/**
 * Remove a journal from the user's cart
 */
export const removeFromCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Please login to access your cart",
      });
    }

    const { cartItemId } = req.params;
    if (!cartItemId) {
      return res.status(400).json({
        success: false,
        message: "Cart item ID is required",
      });
    }

    // Verify cart item exists and belongs to user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: parseInt(cartItemId),
        cart: {
          userId,
          status: "ACTIVE",
        },
      },
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    // Get cart before deleting item
    const cart = await prisma.cart.findFirst({
      where: {
        id: cartItem.cartId,
      },
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Delete the cart item
    await prisma.cartItem.delete({
      where: {
        id: parseInt(cartItemId),
      },
    });

    // Recalculate total amount
    const remainingItems = await prisma.cartItem.findMany({
      where: {
        cartId: cart.id,
      },
    });

    // Calculate new total
    const newTotal = remainingItems.reduce(
      (sum: number, item: any) => sum + parseFloat(item.price.toString()),
      0
    );

    // Update cart total
    await prisma.cart.update({
      where: {
        id: cart.id,
      },
      data: {
        totalAmount: newTotal,
      },
    });

    // Get updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: {
        id: cart.id,
      },
      include: {
        items: {
          include: {
            journal: {
              select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                abstract: true,
                price: true,
                categoryId: true,
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
      cart: updatedCart,
    });
  } catch (error) {
    return handleErrorResponse(error, res, "Error removing item from cart");
  }
};

/**
 * Clear all items from the user's cart
 */
export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Please login to access your cart",
      });
    }

    // Find active cart
    const cart = await prisma.cart.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Active cart not found",
      });
    }

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    // Update cart total to 0
    await prisma.cart.update({
      where: {
        id: cart.id,
      },
      data: {
        totalAmount: 0,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart: {
        ...cart,
        totalAmount: 0,
        items: [],
      },
    });
  } catch (error) {
    return handleErrorResponse(error, res, "Error clearing cart");
  }
};

/**
 * Generate checkout information for payment
 */
export const getCheckoutInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Please login to checkout",
      });
    }

    // Find active cart with items
    const cart = await prisma.cart.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
      include: {
        items: {
          include: {
            journal: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty. Please add items to your cart before checkout",
      });
    }

    // Create checkout info for public REMITA portal
    const remitaInfo = {
      merchantId: process.env.REMITA_MERCHANT_ID || "051701200100",
      publicPortalUrl: "https://login.remita.net/remita/onepage/OAGFCRF/biller.spa",
      orderId: `NERDC-CART-${Date.now()}-${userId}`,
      amount: parseFloat(cart.totalAmount.toString()),
      payerName: cart.user.name || "Guest User",
      payerEmail: cart.user.email,
      payerPhone: cart.user.phone || "",
      description: `Payment for ${cart.items.length} journal(s)`,
      returnUrl: `${process.env.CLIENT_URL || "https://nerdc-journals.vercel.app"}/payment/verify`,
      portalRequestData: {
        serviceName: "NERDC Journal Publication",
        amount: parseFloat(cart.totalAmount.toString()),
        payerName: cart.user.name || "Guest User",
        payerEmail: cart.user.email,
        payerPhone: cart.user.phone || "",
        orderId: `NERDC-CART-${Date.now()}-${userId}`,
      }
    };

    return res.status(200).json({
      success: true,
      message: "Checkout information generated successfully",
      checkout: {
        cart,
        payment: remitaInfo,
      },
    });
  } catch (error) {
    return handleErrorResponse(error, res, "Error generating checkout information");
  }
}; 