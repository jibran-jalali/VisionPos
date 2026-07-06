# VisionPOS Implementation Plan

## 1. Project Identity

### Product Name

VisionPOS

### Project Folder

```text
D:\Desktop\vission pos
```

### Product Type

VisionPOS is a web-based point-of-sale SaaS platform designed for retail stores, grocery shops, pharmacies, small supermarkets, and local businesses. The system will support normal POS workflows first, then expand into AI-powered computer vision checkout where products are recognized using a webcam instead of barcode scanning.

### Product Goal

Build a clean, sellable, production-minded POS system that works with low-cost hardware:

```text
One PC or laptop
One webcam
One printer
Internet connection
Web browser
Local Python Vision Agent later
```

### Core Value Proposition

Traditional shops depend on barcode scanners, manual product search, and expensive POS hardware. VisionPOS aims to reduce hardware cost by using a webcam and AI-powered visual recognition while still providing standard POS features such as inventory, invoicing, user roles, sales history, and business analytics.

---

## 2. Final Technology Decisions

### Frontend

```text
Next.js App Router
React
TypeScript
Tailwind CSS
shadcn/ui
```

### Backend Layer

For the MVP, the backend will live inside the Next.js application using:

```text
Next.js Server Actions
Next.js Route Handlers
Prisma ORM
Auth.js
```

This keeps hosting simple and free-tier friendly. A separate FastAPI backend can be introduced later only if needed.

### Database

```text
Neon PostgreSQL
```

Neon will store users, businesses, stores, products, inventory, sales, invoices, settings, and future visual-profile metadata.

### ORM

```text
Prisma
```

Prisma will provide type-safe database access and schema migrations.

### Authentication

```text
Auth.js
Email/password first
Google login reserved for later
```

### Password Security

```text
bcrypt or argon2
```

The final package will be selected during implementation based on compatibility and simplicity.

### Package Manager

```text
pnpm
```

### Hosting

```text
Vercel free tier for the web application
Neon free tier for PostgreSQL
```

### Storage

Initial MVP can store logo references and metadata. Product video storage for the CV module can use one of these later:

```text
Cloudinary free tier
UploadThing free tier
Object storage provider later
```

### AI / LLM

```text
Groq API later
```

Groq will not be used for product recognition. It will be used for business insights, natural language analytics, sales summaries, reorder suggestions, and admin assistant features.

### Computer Vision

Future CV stack:

```text
Python
OpenCV
NumPy
FAISS
CLIP, MobileNet, or another embedding model
Optional YOLO for product region detection
```

### Local Vision Agent

Future local app:

```text
Python process running on cashier PC
Exposes localhost API or WebSocket
Connects to webcam
Recognizes products locally
Sends recognized product IDs to the web POS page
```

---

## 3. Product Scope

### MVP Scope

The MVP must be a complete normal POS system before computer vision is added.

MVP includes:

```text
Owner registration
Email/password login
Role-based access
Business profile
Store setup
Cashier subaccounts
Product categories
Product catalog
Inventory management
Restocking
Stock movement history
Touch-friendly POS checkout
Cart management
Discounts
Tax support
Multicurrency support
Sale completion
Inventory deduction
Receipt invoice
A4 invoice
Print support through browser print dialog
Sales history
Dashboard summary
Business settings
Invoice settings
```

### Post-MVP Scope

Post-MVP includes:

```text
Product packaging video upload
Frame extraction
Visual embedding generation
Product visual profiles
Local webcam recognition
Automatic cart add from detected products
Recognition confidence control
Duplicate detection prevention
Groq-powered sales assistant
Advanced reports
Direct thermal printer integration
Offline queueing if needed later
Subscription billing if the product is sold as SaaS
```

### Explicitly Out Of MVP Scope

These are intentionally delayed:

```text
Offline checkout
Native mobile app
Real payment gateway
Barcode hardware integration
Multi-product visual recognition
Custom trained object detection model
Accounting ledger
Payroll
Supplier management
Direct ESC/POS printing
```

---

## 4. Business Rules

### First User Rule

The first registered user in a new deployment becomes the platform/business owner.

```text
First account = OWNER
```

### Subaccount Rule

Cashiers cannot self-register.

```text
OWNER, ADMIN, or MANAGER creates cashier accounts
```

### Internet Rule

The MVP requires internet.

Internet is required for:

```text
Login
Session validation
Inventory updates
Sales saving
Invoice saving
Product syncing
Settings updates
```

### Stock Rule

Stock is changed only through controlled stock movements.

Every inventory update must create a stock movement record.

Stock movement types:

```text
STOCK_IN
SALE
RETURN
ADJUSTMENT
DAMAGED
EXPIRED
```

### Product Video Rule

Product packaging video is required only when creating or improving a visual recognition profile.

Restocking does not require product video.

```text
Product identity is separate from inventory quantity
```

### Currency Rule

Currency must not be hardcoded.

Each business will have:

```text
currencyCode
currencySymbol
currencyLocale
```

Default currency:

```text
PKR
```

---

## 5. Roles And Permissions

### Roles

```text
OWNER
ADMIN
MANAGER
CASHIER
```

### OWNER

Full control.

Can:

```text
Manage business profile
Manage stores
Manage all users
Manage settings
Manage products
Manage inventory
Use POS
View sales
View reports
Print invoices
Delete or deactivate records where allowed
```

### ADMIN

Operational admin.

Can:

```text
Manage products
Manage inventory
Manage cashiers
Use POS
View sales
View reports
Manage invoice settings if allowed
```

Cannot:

```text
Delete owner
Transfer ownership
Change critical business ownership settings
```

### MANAGER

Store-level manager.

Can:

```text
Manage products for assigned store
Restock inventory
Use POS
View assigned store sales
View assigned store reports
Manage cashier activity for assigned store
```

### CASHIER

Checkout-only user.

Can:

```text
Open POS checkout
Search products
Add products to cart
Apply allowed discounts if permission is enabled
Complete sale
Print invoice
View own recent sales
```

Cannot:

```text
Change product prices
Change stock directly
Create users
View business-wide analytics
Change settings
Delete sales
```

---

## 6. UI And UX Direction

### Visual Style

The UI should feel like a premium, clean POS product inspired by Odoo, but not copied.

### Theme Direction

```text
White background
Near-black primary text and controls
Soft blue active states
Light green success states
Slate gray secondary UI
Minimal borders
Clean dashboard cards
Large touch targets
```

### Suggested Palette

```text
Background: #F8FAFC
Surface: #FFFFFF
Primary: #111827
Primary Soft: #1F2937
Accent Blue: #38BDF8
Accent Blue Dark: #0284C7
Accent Green: #86EFAC
Accent Green Dark: #16A34A
Muted Text: #64748B
Border: #E2E8F0
Danger: #EF4444
Warning: #F59E0B
```

### Touch Screen Requirements

POS checkout must be usable on touch screens.

Requirements:

```text
Large buttons
Large cart rows
Large product tiles
Clear total display
Minimal typing
Fast product search
Keyboard-friendly shortcuts later
Prominent checkout button
Prominent print button
Simple payment confirmation
```

### Main UI Areas

```text
Login page
Register page
Dashboard layout
Products page
Inventory page
Users page
Sales page
Settings page
POS checkout page
Invoice print pages
```

### Logo Handling

The user will upload the final logo later.

Expected paths:

```text
public/logo.png
public/logo.svg
```

The app should be structured so logo usage is centralized and easy to replace.

Logo appears in:

```text
Login page
Sidebar
Topbar optional
Invoice header
Receipt header
Print templates
```

---

## 7. Invoice And Printing Plan

### Invoice Modes

VisionPOS must support both:

```text
Receipt format
A4 invoice format
```

### Settings

Business settings should include:

```text
Default invoice format: RECEIPT or A4
Receipt width: 58mm, 80mm, or custom later
Show logo on invoice
Show tax number
Show cashier name
Show store address
Show footer message
Auto-open print dialog after sale
```

### MVP Printing Method

Use browser print dialog.

```text
window.print()
Print-specific CSS
Separate invoice page route
```

### Receipt Requirements

Receipt should include:

```text
Business name
Store name
Address optional
Phone optional
Invoice number
Date/time
Cashier name
Item list
Quantity
Unit price
Line total
Subtotal
Discount
Tax
Grand total
Payment method placeholder
Footer message
```

### A4 Invoice Requirements

A4 invoice should include:

```text
Logo
Business name
Business details
Invoice number
Sale date
Cashier
Customer name optional later
Product table
Subtotal
Discount
Tax
Grand total
Footer notes
```

### Future Direct Printer Support

Later we can add:

```text
ESC/POS thermal printer support
Local print bridge
Auto-print without browser dialog
Printer configuration per store
Cash drawer support
```

---

## 8. Database Design

### Main Models

The database should be designed for a real SaaS system, even if the MVP starts with a single business.

Core models:

```text
User
Account
Session
VerificationToken
Business
Store
StoreUser
BusinessSettings
Category
Product
Inventory
StockMovement
Sale
SaleItem
Invoice
ProductVisualProfile
AuditLog
```

### Auth.js Models

Auth.js requires or commonly uses:

```text
User
Account
Session
VerificationToken
```

The User model will be extended with role and business relationship fields.

### Business Model

Purpose:

```text
Represents one business using VisionPOS
```

Important fields:

```text
id
name
slug
email
phone
address
logoUrl
createdAt
updatedAt
```

### Store Model

Purpose:

```text
Represents a physical outlet or branch
```

Important fields:

```text
id
businessId
name
code
address
phone
isActive
createdAt
updatedAt
```

### StoreUser Model

Purpose:

```text
Maps users to stores and roles
```

Important fields:

```text
id
businessId
storeId
userId
role
isActive
createdAt
updatedAt
```

### BusinessSettings Model

Purpose:

```text
Stores business-wide settings
```

Important fields:

```text
id
businessId
currencyCode
currencySymbol
currencyLocale
taxEnabled
taxRate
defaultInvoiceFormat
receiptWidth
invoiceFooter
autoPrint
createdAt
updatedAt
```

### Category Model

Purpose:

```text
Groups products
```

Important fields:

```text
id
businessId
name
color
isActive
createdAt
updatedAt
```

### Product Model

Purpose:

```text
Represents product identity, not stock quantity
```

Important fields:

```text
id
businessId
categoryId
name
sku
description
price
costPrice optional
imageUrl
isActive
isVisionEnabled
createdAt
updatedAt
```

### Inventory Model

Purpose:

```text
Stores current stock per product per store
```

Important fields:

```text
id
businessId
storeId
productId
quantity
reorderLevel
updatedAt
```

### StockMovement Model

Purpose:

```text
Provides full audit trail of stock changes
```

Important fields:

```text
id
businessId
storeId
productId
type
quantity
previousQuantity
newQuantity
reason
createdById
saleId optional
createdAt
```

### Sale Model

Purpose:

```text
Represents checkout transaction
```

Important fields:

```text
id
businessId
storeId
cashierId
invoiceNumber
subtotal
discountAmount
taxAmount
totalAmount
currencyCode
currencySymbol
paymentMethod
status
createdAt
updatedAt
```

### SaleItem Model

Purpose:

```text
Stores line items for each sale
```

Important fields:

```text
id
saleId
productId
productNameSnapshot
skuSnapshot
quantity
unitPrice
discountAmount
taxAmount
lineTotal
createdAt
```

### Invoice Model

Purpose:

```text
Stores invoice metadata and print format
```

Important fields:

```text
id
businessId
storeId
saleId
invoiceNumber
format
printedAt
createdAt
```

### ProductVisualProfile Model

Purpose:

```text
Stores future computer vision metadata for product recognition
```

Important fields:

```text
id
businessId
productId
videoUrl
frameCount
embeddingModel
profileStatus
confidenceThreshold
createdAt
updatedAt
```

### AuditLog Model

Purpose:

```text
Records important business actions
```

Important fields:

```text
id
businessId
userId
action
entityType
entityId
metadata
createdAt
```

---

## 9. Planned Application Routes

### Public Routes

```text
/
/login
/register
```

### Dashboard Routes

```text
/dashboard
/dashboard/products
/dashboard/products/new
/dashboard/products/[id]
/dashboard/categories
/dashboard/inventory
/dashboard/inventory/restock
/dashboard/users
/dashboard/sales
/dashboard/sales/[id]
/dashboard/settings
```

### POS Routes

```text
/pos
/pos/checkout
```

### Invoice Routes

```text
/invoices/[id]
/invoices/[id]/receipt
/invoices/[id]/a4
```

### API Routes

```text
/api/auth/[...nextauth]
/api/products
/api/inventory
/api/sales
/api/users
/api/settings
/api/vision/status later
/api/vision/match later
```

---

## 10. Recommended File Structure

The exact structure may be adjusted during implementation, but the project should remain clean and modular.

```text
vission pos/
  app/
    page.tsx
    layout.tsx
    globals.css
    login/
      page.tsx
    register/
      page.tsx
    dashboard/
      layout.tsx
      page.tsx
      products/
        page.tsx
        new/
          page.tsx
        [id]/
          page.tsx
      categories/
        page.tsx
      inventory/
        page.tsx
        restock/
          page.tsx
      users/
        page.tsx
      sales/
        page.tsx
        [id]/
          page.tsx
      settings/
        page.tsx
    pos/
      layout.tsx
      page.tsx
      checkout/
        page.tsx
    invoices/
      [id]/
        page.tsx
        receipt/
          page.tsx
        a4/
          page.tsx
    api/
      auth/
        [...nextauth]/
          route.ts

  components/
    ui/
    layout/
      app-sidebar.tsx
      dashboard-shell.tsx
      topbar.tsx
    auth/
      login-form.tsx
      register-form.tsx
    dashboard/
      metric-card.tsx
      recent-sales.tsx
    products/
      product-form.tsx
      product-table.tsx
      product-card.tsx
    inventory/
      inventory-table.tsx
      restock-form.tsx
    pos/
      pos-shell.tsx
      product-grid.tsx
      cart-panel.tsx
      checkout-summary.tsx
      payment-panel.tsx
    invoices/
      receipt-template.tsx
      a4-template.tsx
      print-actions.tsx
    settings/
      business-settings-form.tsx
      invoice-settings-form.tsx

  lib/
    auth.ts
    db.ts
    prisma.ts
    permissions.ts
    currency.ts
    invoice.ts
    stock.ts
    sales.ts
    utils.ts

  prisma/
    schema.prisma
    migrations/

  public/
    logo.png

  vision-agent/
    README.md
    main.py
    api.py
    camera.py
    detector.py
    embedder.py
    matcher.py
    video_processor.py
    frame_extractor.py
    requirements.txt

  docs/
    architecture.md
    setup.md
    printer-setup.md
    vision-agent.md

  IMPLEMENTATION_PLAN.md
  README.md
  package.json
```

---

## 11. Major Feature Design

### 11.1 Registration And Login

Initial flow:

```text
User opens register page
User enters name, email, password, business name
System creates user
System creates business
System creates default store
System creates default business settings
System assigns user as OWNER
User is redirected to dashboard
```

### 11.2 Admin Creates Cashier

Flow:

```text
Owner/Admin opens users page
Clicks Add User
Enters name, email, password, role, assigned store
System creates user
System creates StoreUser relationship
Cashier can login
Cashier sees POS only or limited dashboard
```

### 11.3 Product Management

Product fields:

```text
Name
SKU
Category
Price
Optional cost price
Optional image
Active/inactive
Vision enabled later
```

Product creation should optionally create inventory row for selected store.

### 11.4 Inventory Management

Inventory must show:

```text
Product
SKU
Category
Store
Current quantity
Reorder level
Stock status
Last updated
```

Restock flow:

```text
Select product
Enter quantity to add
Enter reason optional
System updates inventory
System creates STOCK_IN movement
```

### 11.5 POS Checkout

POS should be the most polished screen.

Layout:

```text
Left: product search and product grid
Right: cart and checkout summary
Top: cashier/store/session info
Bottom/right: payment and checkout controls
```

Cart features:

```text
Add product
Increase quantity
Decrease quantity
Remove item
Apply discount
Calculate tax
Show subtotal
Show total
Complete sale
```

Sale completion must:

```text
Create Sale
Create SaleItems
Deduct inventory
Create StockMovement records
Create Invoice record
Redirect or open invoice print page
```

### 11.6 Sales History

Sales page should show:

```text
Invoice number
Date
Store
Cashier
Items count
Total
Status
Print action
View details action
```

### 11.7 Dashboard Summary

Dashboard should show:

```text
Today's sales
Today's revenue
Total products
Low-stock products
Recent sales
Top products later
```

### 11.8 Settings

Settings should include:

```text
Business details
Currency settings
Tax settings
Invoice settings
Receipt settings
Logo placeholder
```

---

## 12. Computer Vision Architecture For Later

### Why Local Agent

Cloud video processing would be expensive, slow, and bandwidth-heavy. The local agent lets shops use normal PCs and webcams without cloud GPU cost.

### Local Agent Responsibilities

```text
Access webcam
Process product video
Extract frames
Generate embeddings
Store local recognition index
Match webcam frames to known products
Expose local API or WebSocket
Send recognized product to POS web page
```

### Local Agent API Concept

```text
GET  http://localhost:8765/health
POST http://localhost:8765/sync-products
POST http://localhost:8765/process-video
GET  ws://localhost:8765/detections
```

### Product Onboarding With Video

Flow:

```text
Admin creates product in web app
Admin uploads/records packaging video
Video is stored
Vision processor extracts frames
Bad frames are filtered
Embeddings are generated
Embeddings are linked to product ID
Product visual profile becomes READY
```

### Checkout Recognition

Flow:

```text
Cashier opens POS page
Cashier starts Vision Agent
POS connects to localhost agent
Webcam sees product
Agent detects product area
Agent generates embedding
Agent matches against known profiles
Agent returns product ID and confidence
POS adds product to cart after stable confidence
```

### Recognition Stabilization

To avoid false additions:

```text
Require confidence above threshold
Require same product for N frames
Cooldown after adding item
Manual confirm option for low confidence
```

### Duplicate Prevention

Rules:

```text
Do not add same product repeatedly every frame
Use cooldown timer
Use stable detection state
Allow cashier to increase quantity manually
Advanced: detect product removal/replacement later
```

---

## 13. Free-Tier Hosting Strategy

### MVP Hosting

```text
Web app: Vercel free tier
Database: Neon free tier
CV: local cashier PC
AI: Groq free tier later
Storage: free-tier service later
```

### Why This Is Low Cost

```text
No cloud GPU
No paid database initially
No paid backend server initially
No paid barcode hardware required
```

### Deployment Environment Variables

Expected variables:

```text
DATABASE_URL
AUTH_SECRET
AUTH_URL
NEXTAUTH_URL if needed by Auth.js setup
GROQ_API_KEY later
STORAGE_API_KEY later
```

---

## 14. Security And Data Protection

### Authentication Security

```text
Hash passwords
Never store plaintext passwords
Use secure sessions
Protect dashboard routes
Protect API routes
```

### Authorization Security

Every server action or API mutation must check:

```text
Is user logged in?
Does user belong to business?
Does user have required role?
Is user allowed to access this store?
```

### Data Isolation

Every business-scoped query must filter by:

```text
businessId
```

Store-scoped queries should also filter by:

```text
storeId
```

### Auditability

Important actions should eventually create audit logs:

```text
User created
Product created
Product price changed
Stock adjusted
Sale completed
Settings changed
```

---

## 15. Code Quality Rules

### General

```text
Keep code modular
Use TypeScript types
Keep server logic out of UI components where possible
Use Prisma transactions for sale completion
Use reusable permission helpers
Use reusable currency formatting helpers
Avoid hardcoded business values
Avoid hardcoded currency
Avoid overengineering before MVP works
```

### UI Components

```text
Use shadcn/ui base components
Create custom POS components for touch workflow
Keep forms consistent
Keep table actions predictable
Use loading states
Use empty states
Use error states
```

### Database Mutations

Critical mutations such as checkout must use transactions.

Sale completion must either fully succeed or fail without partial stock updates.

### Naming

Use clear domain names:

```text
Product
Inventory
StockMovement
Sale
SaleItem
Invoice
BusinessSettings
```

Do not use vague names such as:

```text
Data
ItemData
Stuff
Manager2
TempThing
```

---

## 16. Implementation Phases

### Phase 1: Project Foundation

Goals:

```text
Initialize Next.js project
Install TypeScript, Tailwind, shadcn/ui
Install Prisma
Install Auth.js
Create clean layout structure
Create base theme
Create placeholder logo system
```

Success criteria:

```text
App runs locally
Landing/login/register pages render
Tailwind works
shadcn/ui works
Prisma is configured
```

### Phase 2: Database And Auth

Goals:

```text
Create Prisma schema
Connect Neon database
Create Auth.js email/password flow
Create first account as OWNER
Create protected dashboard routes
Create role helpers
```

Success criteria:

```text
User can register
User can login
First user becomes OWNER
Dashboard is protected
User session is available server-side
```

### Phase 3: Business And Settings

Goals:

```text
Create business profile
Create default store
Create business settings
Implement settings page
Add currency settings
Add invoice format settings
```

Success criteria:

```text
Owner can update business settings
Currency formatting works
Default invoice format can be changed
```

### Phase 4: Products And Categories

Goals:

```text
Create categories
Create products
Edit products
Deactivate products
Display product table
Display product cards for POS
```

Success criteria:

```text
Owner/admin can manage product catalog
Products are business-scoped
Products are available to POS screen
```

### Phase 5: Inventory

Goals:

```text
Create inventory records
Restock products
Track stock movements
Show low stock
Show inventory table
```

Success criteria:

```text
Stock can be added
Stock movements are recorded
Low-stock products are visible
```

### Phase 6: POS Checkout

Goals:

```text
Build touch-friendly POS screen
Product search
Product grid
Cart panel
Quantity controls
Discount support
Tax calculation
Checkout button
```

Success criteria:

```text
Cashier can build cart
Totals calculate correctly
UI is fast and touch-friendly
```

### Phase 7: Sales, Inventory Deduction, Invoices

Goals:

```text
Complete sale transaction
Create sale items
Deduct inventory
Create stock movement records
Create invoice record
Open invoice page
Print receipt
Print A4 invoice
```

Success criteria:

```text
Checkout works end-to-end
Stock decreases after sale
Invoice prints correctly
Sale appears in sales history
```

### Phase 8: Dashboard Analytics

Goals:

```text
Today's revenue
Today's sales count
Total products
Low stock count
Recent sales
```

Success criteria:

```text
Owner/admin can understand store status from dashboard
```

### Phase 9: CV Preparation

Goals:

```text
Add ProductVisualProfile model
Add UI placeholder for visual recognition
Add video upload placeholder
Document local agent setup
```

Success criteria:

```text
Codebase is ready for local vision agent integration
```

### Phase 10: Local Vision Agent

Goals:

```text
Create Python local agent
Access webcam
Expose health endpoint
Extract frames from product videos
Generate embeddings
Match product images
Send detections to POS
```

Success criteria:

```text
Product can be recognized locally and added to POS cart
```

---

## 17. Testing Plan

### Manual Tests For MVP

```text
Register first owner
Login owner
Create cashier
Login cashier
Create category
Create product
Restock product
Open POS
Add product to cart
Change quantity
Complete sale
Verify inventory decreases
Verify stock movement created
Print receipt
Print A4 invoice
View sales history
Update settings
Change currency
Verify currency appears correctly
```

### Critical Transaction Test

Sale completion must be tested carefully:

```text
Sale record created
Sale items created
Inventory deducted
Stock movements created
Invoice created
No partial writes on error
```

### Role Tests

```text
Cashier cannot access settings
Cashier cannot create products
Cashier can use POS
Manager cannot change owner settings
Owner can access all pages
```

---

## 18. Future Selling Considerations

### SaaS Readiness

Design should support multiple businesses from the start.

Each business must have isolated:

```text
Users
Stores
Products
Inventory
Sales
Settings
Invoices
Visual profiles
```

### Future Pricing Features

Later we can add:

```text
Subscription plans
Trial period
Feature limits
Store limits
Cashier limits
Product limits
Invoice limits
```

### Future Hardware Support

Later we can add:

```text
Thermal printers
Cash drawers
Barcode scanners as fallback
Weighing scales
Customer display
```

---

## 19. Immediate Next Step

After this plan is approved, implementation should start with Phase 1.

First implementation tasks:

```text
Initialize Next.js project in D:\Desktop\vission pos
Install pnpm dependencies
Set up Tailwind
Set up shadcn/ui
Create base layout
Create initial README
Set up Prisma
Prepare Auth.js structure
```

No computer vision code should be built before the core POS system works.

---

## 20. Final Build Principle

Build the system in this order:

```text
Reliable POS first
Beautiful touch UI second
Clean multi-user SaaS structure third
Invoices and printing fourth
Computer vision fifth
AI business assistant sixth
```

The product must be useful as a normal POS even before AI recognition is added. This makes VisionPOS easier to test, easier to sell, and safer to build.
