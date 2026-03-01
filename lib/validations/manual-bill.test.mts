import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizePhoneIndia,
  manualBillSchema,
} from "./manual-bill.ts";

test("normalizePhoneIndia returns +91 + 10 digits from 10 digits", () => {
  assert.equal(normalizePhoneIndia("9876543210"), "+919876543210");
  assert.equal(normalizePhoneIndia("  9876543210  "), "+919876543210");
});

test("normalizePhoneIndia returns +91 + last 10 when more digits", () => {
  assert.equal(normalizePhoneIndia("919876543210"), "+919876543210");
  assert.equal(normalizePhoneIndia("+91 9876543210"), "+919876543210");
});

test("normalizePhoneIndia returns trimmed input when not 10 digits", () => {
  assert.equal(normalizePhoneIndia("123"), "123");
  assert.equal(normalizePhoneIndia(""), "");
});

test("manualBillSchema accepts valid payload with 10-digit phone", () => {
  const result = manualBillSchema.safeParse({
    customerName: "Test Customer",
    phone: "9876543210",
    address: "",
    itemDescription: "Item A",
    totalAmount: 1000,
    paymentMode: "Cash",
    photoUrl: "https://example.com/photo.jpg",
  });
  assert.equal(result.success, true);
});

test("manualBillSchema rejects when payment mode is Finance but financeCompany empty", () => {
  const result = manualBillSchema.safeParse({
    customerName: "Test",
    phone: "9876543210",
    itemDescription: "Item",
    totalAmount: 1000,
    paymentMode: "Finance",
    photoUrl: "https://example.com/photo.jpg",
  });
  assert.equal(result.success, false);
});

test("manualBillSchema accepts when payment mode is Finance with financeCompany", () => {
  const result = manualBillSchema.safeParse({
    customerName: "Test",
    phone: "9876543210",
    itemDescription: "Item",
    totalAmount: 1000,
    paymentMode: "Finance",
    financeCompany: "HDFC Bank",
    photoUrl: "https://example.com/photo.jpg",
  });
  assert.equal(result.success, true);
});

test("manualBillSchema accepts payment mode UPI", () => {
  const result = manualBillSchema.safeParse({
    customerName: "Test",
    phone: "9876543210",
    itemDescription: "Item",
    totalAmount: 500,
    paymentMode: "UPI",
    photoUrl: "https://example.com/photo.jpg",
  });
  assert.equal(result.success, true);
});

test("manualBillSchema rejects invalid phone", () => {
  const result = manualBillSchema.safeParse({
    customerName: "Test",
    phone: "123",
    itemDescription: "Item",
    totalAmount: 100,
    paymentMode: "Cash",
    photoUrl: "https://example.com/photo.jpg",
  });
  assert.equal(result.success, false);
});
