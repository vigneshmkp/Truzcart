package com.truzcart.util;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

public final class OrderNumberGenerator {

    private static final AtomicInteger counter = new AtomicInteger(1);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private OrderNumberGenerator() {}

    public static String generate() {
        String datePart = LocalDate.now().format(DATE_FORMAT);
        int count = counter.getAndIncrement();
        return String.format("TRZ-%s-%04d", datePart, count);
    }

    public static String generate(String prefix) {
        String datePart = LocalDate.now().format(DATE_FORMAT);
        long timestamp = System.currentTimeMillis() % 100000;
        return String.format("%s-%s-%05d", prefix, datePart, timestamp);
    }
}
