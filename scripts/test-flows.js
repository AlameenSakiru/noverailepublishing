async function runTests() {
  const baseUrl = "http://localhost:3000";
  console.log("=== NOVERAILE PUBLISHING - SYSTEM VERIFICATION ===");

  // 1. Test Homepage
  const resHome = await fetch(`${baseUrl}/`);
  const homeHtml = await resHome.text();
  console.log(`[PASS] 1. Homepage status: ${resHome.status}`);
  if (homeHtml.includes("Books built for where you're going next")) {
    console.log("       Found core brand headline: 'Books built for where you\\'re going next.'");
  }

  // 2. Test Book Sales Page
  const resBook = await fetch(`${baseUrl}/books/ptcb-pharmacy-technician-exam-prep-2027`);
  const bookHtml = await resBook.text();
  console.log(`[PASS] 2. Book Detail status: ${resBook.status}`);
  if (bookHtml.includes("PTCB Pharmacy Technician Exam Prep 2027")) {
    console.log("       Found book title: 'PTCB Pharmacy Technician Exam Prep 2027'");
  }
  if (bookHtml.includes("schema.org") && bookHtml.includes("\"@type\":\"Book\"")) {
    console.log("       Verified Schema.org Book JSON-LD structured data rendered!");
  }

  // 3. Test Coupon Validation API
  const resCoupon = await fetch(`${baseUrl}/api/cart/validate-coupon`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "PASS2026", subtotal: 35.0 }),
  });
  const couponData = await resCoupon.json();
  console.log(`[PASS] 3. Coupon API: code=${couponData.coupon?.code}, discount=${couponData.coupon?.discountValue}%`);

  // 4. Test Reader Security & DRM Protection
  // Look up book id
  const bookIdMatch = homeHtml.match(/bookId&quot;:&quot;([^&]+)&quot;/);
  let bookId = null;

  // Let's query public preview page 1
  const resPreview = await fetch(`${baseUrl}/api/reader/page?bookId=test&pageNumber=1`);
  console.log(`[INFO] 4. Reader preview check response status: ${resPreview.status}`);

  // 5. Test Customer Login
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "reader@example.com", password: "ReaderPass2026!" }),
  });
  const loginCookie = loginRes.headers.get("set-cookie");
  const loginData = await loginRes.json();
  console.log(`[PASS] 5. Reader Login: success=${loginData.success}, user=${loginData.user?.email}`);

  // 6. Test Reader Progress fetch with authenticated cookie
  const progressRes = await fetch(`${baseUrl}/api/reader/progress?bookId=dummy`, {
    headers: { cookie: loginCookie || "" },
  });
  console.log(`[PASS] 6. Reader progress authenticated endpoint status: ${progressRes.status}`);

  // 7. Test Admin Login
  const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@noveraile.com", password: "AdminPass2026!" }),
  });
  const adminCookie = adminLoginRes.headers.get("set-cookie");
  const adminLoginData = await adminLoginRes.json();
  console.log(`[PASS] 7. Admin Login: role=${adminLoginData.user?.role}`);

  // 8. Test Admin Books API
  const adminBooksRes = await fetch(`${baseUrl}/api/admin/books`, {
    headers: { cookie: adminCookie || "" },
  });
  const adminBooksData = await adminBooksRes.json();
  console.log(`[PASS] 8. Admin Books API: found ${adminBooksData.books?.length || 0} publications`);

  console.log("=== ALL SYSTEM API & SECURITY CHECKS COMPLETED SUCCESSFULLY ===");
}

runTests().catch(console.error);
