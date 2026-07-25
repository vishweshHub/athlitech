# AthliTech — Known Limitations & V2 Roadmap

This document outlines key technical limitations in AthliTech V1 and recommended target areas for the V2 release.

---

## 1. Dynamic RBAC is Database-Only
*   **Limitation**: The dynamic Roles and Permissions collections and schemas are implemented, but route auth filters continue to perform basic string checks (`role == "coach"`, `role == "athlete"`, `role == "admin"`).
*   **V2 Target**: Migrating the path authentication dependencies to evaluate users against the dynamic permissions database mappings (e.g. checking `user.has_permission("write:workout")`) rather than hardcoded role filters.

---

## 2. Local Web Session Fallback
*   **Limitation**: Expo SecureStore does not support web browsers natively. The token storage adapter successfully falls back to standard `localStorage` on Web platform targets.
*   **V2 Target**: Implementing Secure HttpOnly cookies for Web clients and storing access tokens in-memory to improve security against Cross-Site Scripting (XSS).

---

## 3. Lack of Self-Service Password Reset
*   **Limitation**: There is no self-service password reset or verification email flow. Passwords must be updated by an administrator via administrative endpoints or direct database manipulation.
*   **V2 Target**: Integrating an email delivery service (e.g. SendGrid or Amazon SES) to send OTP or secure magic-link tokens for account verification and password recovery.

---

## 4. No Media/Video File Attachments
*   **Limitation**: Workout and performance tracking only support structured text, data values, and string metrics. There is no support for uploading athlete execution videos or attachments.
*   **V2 Target**: Adding AWS S3 or Google Cloud Storage attachments for video analysis and photo logging of training forms.
