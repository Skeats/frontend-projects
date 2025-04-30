'use client';
import React from "react";

export default function AddToCart() {
    return (
        <button onClick={() => alert("Added to cart")} className='p-3 my-2 bg-sky-400 text-white text-xl hover:bg-sky-600 rounded-lg transition-colors duration-500 w-max'>Add To Cart</button>
    );
};