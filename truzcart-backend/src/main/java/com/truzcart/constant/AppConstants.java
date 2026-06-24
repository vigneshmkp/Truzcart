package com.truzcart.constant;

public final class AppConstants {

    private AppConstants() {}

    // Roles
    public static final String ROLE_ADMIN = "ROLE_ADMIN";
    public static final String ROLE_CUSTOMER = "ROLE_CUSTOMER";

    // Pagination
    public static final int DEFAULT_PAGE_SIZE = 12;
    public static final int MAX_PAGE_SIZE = 50;
    public static final String DEFAULT_SORT_BY = "createdAt";
    public static final String DEFAULT_SORT_DIR = "desc";

    // Order Number Prefix
    public static final String ORDER_NUMBER_PREFIX = "TRZ";

    // JWT
    public static final String TOKEN_TYPE = "Bearer";
    public static final String AUTH_HEADER = "Authorization";
    public static final String TOKEN_PREFIX = "Bearer ";

    // Payment
    public static final String CURRENCY_INR = "INR";
    public static final int RAZORPAY_AMOUNT_MULTIPLIER = 100; // paise

    // Audit Actions
    public static final String ACTION_CREATE = "CREATE";
    public static final String ACTION_UPDATE = "UPDATE";
    public static final String ACTION_DELETE = "DELETE";
    public static final String ACTION_LOGIN = "LOGIN";
    public static final String ACTION_LOGOUT = "LOGOUT";
    public static final String ACTION_STATUS_CHANGE = "STATUS_CHANGE";
}
