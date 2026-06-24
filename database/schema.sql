-- =============================================
-- TruzCart — Complete PostgreSQL Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USER MANAGEMENT
-- =============================================

CREATE TABLE roles (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    avatar_url      VARCHAR(500),
    email_verified  BOOLEAN      NOT NULL DEFAULT FALSE,
    enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE addresses (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label       VARCHAR(50)  NOT NULL DEFAULT 'Home',
    full_name   VARCHAR(200) NOT NULL,
    phone       VARCHAR(20)  NOT NULL,
    street      VARCHAR(500) NOT NULL,
    city        VARCHAR(100) NOT NULL,
    state       VARCHAR(100) NOT NULL,
    zip_code    VARCHAR(20)  NOT NULL,
    country     VARCHAR(100) NOT NULL DEFAULT 'India',
    is_default  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(500) NOT NULL UNIQUE,
    expires_at  TIMESTAMP    NOT NULL,
    revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- =============================================
-- 2. PRODUCT MANAGEMENT
-- =============================================

CREATE TABLE categories (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    slug          VARCHAR(120)  NOT NULL UNIQUE,
    description   TEXT,
    image_url     VARCHAR(500),
    parent_id     BIGINT        REFERENCES categories(id) ON DELETE SET NULL,
    display_order INT           NOT NULL DEFAULT 0,
    active        BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(300)   NOT NULL,
    slug                VARCHAR(350)   NOT NULL UNIQUE,
    description         TEXT,
    short_description   VARCHAR(500),
    sku                 VARCHAR(100)   NOT NULL UNIQUE,
    price               DECIMAL(12,2)  NOT NULL CHECK (price >= 0),
    compare_at_price    DECIMAL(12,2)  CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
    cost_price          DECIMAL(12,2)  CHECK (cost_price IS NULL OR cost_price >= 0),
    stock_quantity      INT            NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INT            NOT NULL DEFAULT 10,
    weight              DECIMAL(8,2),
    dimensions          VARCHAR(100),
    category_id         BIGINT         REFERENCES categories(id) ON DELETE SET NULL,
    brand               VARCHAR(150),
    is_active           BOOLEAN        NOT NULL DEFAULT TRUE,
    is_featured         BOOLEAN        NOT NULL DEFAULT FALSE,
    average_rating      DECIMAL(3,2)   NOT NULL DEFAULT 0.00,
    review_count        INT            NOT NULL DEFAULT 0,
    created_at          TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE TABLE product_images (
    id            BIGSERIAL PRIMARY KEY,
    product_id    BIGINT       NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url     VARCHAR(500) NOT NULL,
    alt_text      VARCHAR(300),
    display_order INT          NOT NULL DEFAULT 0,
    is_primary    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory_logs (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT       NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_change  INT          NOT NULL,
    previous_stock  INT          NOT NULL,
    new_stock       INT          NOT NULL,
    reason          VARCHAR(100) NOT NULL,
    reference_id    VARCHAR(100),
    created_by      BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- =============================================
-- 3. SHOPPING
-- =============================================

CREATE TABLE carts (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT    UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    session_id  VARCHAR(255),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_items (
    id          BIGSERIAL PRIMARY KEY,
    cart_id     BIGINT    NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id  BIGINT    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity    INT       NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (cart_id, product_id)
);

CREATE TABLE wishlists (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  BIGINT    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, product_id)
);

-- =============================================
-- 4. ORDERS
-- =============================================

CREATE TABLE orders (
    id                  BIGSERIAL PRIMARY KEY,
    order_number        VARCHAR(50)    NOT NULL UNIQUE,
    user_id             BIGINT         NOT NULL REFERENCES users(id),
    shipping_address_id BIGINT         REFERENCES addresses(id),
    billing_address_id  BIGINT         REFERENCES addresses(id),
    subtotal            DECIMAL(12,2)  NOT NULL CHECK (subtotal >= 0),
    discount_amount     DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
    tax_amount          DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
    shipping_amount     DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
    total_amount        DECIMAL(12,2)  NOT NULL CHECK (total_amount >= 0),
    coupon_id           BIGINT         REFERENCES coupons(id),
    status              VARCHAR(30)    NOT NULL DEFAULT 'PENDING',
    notes               TEXT,
    created_at          TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
    id            BIGSERIAL PRIMARY KEY,
    order_id      BIGINT         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id    BIGINT         REFERENCES products(id) ON DELETE SET NULL,
    product_name  VARCHAR(300)   NOT NULL,
    product_sku   VARCHAR(100)   NOT NULL,
    product_image VARCHAR(500),
    quantity      INT            NOT NULL CHECK (quantity > 0),
    unit_price    DECIMAL(12,2)  NOT NULL CHECK (unit_price >= 0),
    total_price   DECIMAL(12,2)  NOT NULL CHECK (total_price >= 0),
    created_at    TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE TABLE order_status_history (
    id          BIGSERIAL PRIMARY KEY,
    order_id    BIGINT       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status      VARCHAR(30)  NOT NULL,
    notes       TEXT,
    created_by  BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- =============================================
-- 5. PAYMENTS
-- =============================================

CREATE TABLE payments (
    id                    BIGSERIAL PRIMARY KEY,
    order_id              BIGINT         NOT NULL REFERENCES orders(id),
    razorpay_order_id     VARCHAR(255),
    razorpay_payment_id   VARCHAR(255),
    razorpay_signature    VARCHAR(500),
    amount                DECIMAL(12,2)  NOT NULL CHECK (amount >= 0),
    currency              VARCHAR(10)    NOT NULL DEFAULT 'INR',
    method                VARCHAR(50),
    status                VARCHAR(30)    NOT NULL DEFAULT 'CREATED',
    failure_reason        TEXT,
    created_at            TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE TABLE transactions (
    id            BIGSERIAL PRIMARY KEY,
    payment_id    BIGINT         NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    type          VARCHAR(30)    NOT NULL,
    amount        DECIMAL(12,2)  NOT NULL,
    status        VARCHAR(30)    NOT NULL,
    reference_id  VARCHAR(255),
    created_at    TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- =============================================
-- 6. PROMOTIONS
-- =============================================

CREATE TABLE coupons (
    id               BIGSERIAL PRIMARY KEY,
    code             VARCHAR(50)    NOT NULL UNIQUE,
    description      VARCHAR(500),
    discount_type    VARCHAR(20)    NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
    discount_value   DECIMAL(12,2)  NOT NULL CHECK (discount_value > 0),
    min_order_amount DECIMAL(12,2)  DEFAULT 0.00,
    max_discount     DECIMAL(12,2),
    usage_limit      INT,
    used_count       INT            NOT NULL DEFAULT 0,
    valid_from       TIMESTAMP      NOT NULL,
    valid_until      TIMESTAMP      NOT NULL,
    active           BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE TABLE coupon_usage (
    id          BIGSERIAL PRIMARY KEY,
    coupon_id   BIGINT    NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id     BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id    BIGINT    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    used_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (coupon_id, user_id, order_id)
);

-- =============================================
-- 7. REVIEWS
-- =============================================

CREATE TABLE reviews (
    id                   BIGSERIAL PRIMARY KEY,
    user_id              BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id           BIGINT    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rating               INT       NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title                VARCHAR(200),
    comment              TEXT,
    is_verified_purchase BOOLEAN   NOT NULL DEFAULT FALSE,
    is_approved          BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, product_id)
);

-- =============================================
-- 8. AUDIT
-- =============================================

CREATE TABLE audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id   BIGINT,
    old_value   TEXT,
    new_value   TEXT,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_enabled ON users(enabled);

-- Addresses
CREATE INDEX idx_addresses_user_id ON addresses(user_id);

-- Refresh Tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- Categories
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(active);

-- Products
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('english', name));
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- Product Images
CREATE INDEX idx_product_images_product_id ON product_images(product_id);

-- Inventory Logs
CREATE INDEX idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX idx_inventory_logs_created_at ON inventory_logs(created_at DESC);

-- Carts
CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- Wishlists
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlists_product_id ON wishlists(product_id);

-- Orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Payments
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Coupons
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(active);

-- Reviews
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Audit
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =============================================
-- SEED DATA: Roles
-- =============================================

INSERT INTO roles (name, description) VALUES
    ('ROLE_ADMIN', 'Administrator with full access'),
    ('ROLE_CUSTOMER', 'Regular customer');
