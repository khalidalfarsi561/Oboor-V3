# مشروع متجر المكافآت (Rewards Store)

هذا المشروع عبارة عن تطبيق ويب مبني باستخدام [Next.js](https://nextjs.org/) و [Firebase](https://firebase.google.com/)، ويتيح للمستخدمين تخطي روابط مختصرة وربح رصيد لاسترداده من المتجر.

## 🚀 الميزات الأساسية:
- نظام مصادقة (تسجيل دخول) آمن عبر **Google** (Firebase Auth).
- مكافآت وأكواد بطريقة (استرداد الكود) محصنة وحقيقية عبر **Firestore Transactions**.
- تزامن مباشر للرصيد بفضل `onSnapshot`.
- واجهة مستخدم حديثة ومريحة باستخدام **Tailwind CSS**.

## 🛠️ المتطلبات الأساسية
تأكد من توفر البرامج التالية على جهازك قبل البدء:
- [Node.js](https://nodejs.org/en/) (يفضل الإصدار 18 فما فوق).
- حساب [Firebase](https://console.firebase.google.com/) لتفعيل قاعدة البيانات والمصادقة.

## ⚙️ طريقة التثبيت والتشغيل محلياً قِبل الرفع

1. **قم بتنزيل مستودع الكود (Clone)**
   ```bash
   git clone <URL_المستودع>
   cd <اسم-المجلد>
   ```

2. **تثبيت الحزم البرمجية (Dependencies)**
   ```bash
   npm install
   ```

3. **إعداد متغيرات البيئة (Environment Variables)**
   - قم بنسخ ملف `.env.example` وأعد تسميته إلى `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - املأ البيانات المطلوبة إذا كانت هناك أية مفاتيح إضافية.

4. **إعداد Firebase**
   - المشروع يعتمد على ملف `firebase-applet-config.json` للاتصال بـ Firebase.
   - تأكد من أن قواعد البيانات في `firestore.rules` تم رفعها بشكل صحيح إلى مشروعك للحفاظ على الأمان (يمكنك نسخ القواعد من ملف `firestore.rules` ولصقها في لوحة تحكم Firebase).

5. **تشغيل بيئة التطوير (Development Server)**
   ```bash
   npm run dev
   ```
   سيتم تشغيل التطبيق على الرابط [http://localhost:3000](http://localhost:3000).

## 🔒 ملاحظات حول الأمان قبل الرفع لـ GitHub
- **ملفات `.env`:** محظورة تلقائياً من الرفع بواسطة ملف `.gitignore` لحماية أي بيانات سرية.
- **`firebase-applet-config.json`:** بيانات الاتصال بـ Firebase Web آمنة للظهور للعميل ومسموح بنشرها، لأن حماية Firebase الحقيقية تتم عبر **قواعد الأمان (Security Rules)** وليس عبر إخفاء ملف الـ Config.
- تأكد أن ملف `firestore.rules` مرفوع على Firebase بإحكام حتى لا يتمكن أحد من تعديل الأرصدة عبر الـ API مباشرة.

## 📦 بناء نسخة الإنتاج (Production Build)
لإنشاء نسخة محسنة وسريعة جاهزة للإنتاج:
```bash
npm run build
npm run start
```
