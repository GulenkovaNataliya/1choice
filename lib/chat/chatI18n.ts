/**
 * Lead form localization strings for the chat widget.
 * Supported languages: en | ru | el
 */

export type ChatLang = "en" | "ru" | "el" | "ar" | "he";

/** Derive ChatLang from the STT language code (or any BCP-47 tag). */
export function detectLang(sttCode: string): ChatLang {
  if (sttCode.startsWith("ru")) return "ru";
  if (sttCode.startsWith("el")) return "el";
  if (sttCode.startsWith("ar")) return "ar";
  if (sttCode.startsWith("he")) return "he";
  return "en";
}

export type FormStrings = {
  namePlaceholder:     string;
  whatsappPlaceholder: string;
  emailPlaceholder:    string;
  notesPlaceholder:    string;
  consentText:         string;
  submitLabel:         string;
  submittingLabel:     string;
  successText:         string;
  // validation
  nameRequired:       string;
  whatsappRequired:   string;
  whatsappFormat:     string;
  emailInvalid:       string;
  consentRequired:    string;
  // errors
  timeoutError:       string;
  networkError:       string;
  submitError:        string;
  // rate-limit / refusal (shown inline in chat)
  rateLimitMsg:       string;
  refusalMsg:         string;
};

const STRINGS: Record<ChatLang, FormStrings> = {
  en: {
    namePlaceholder:     "Your name *",
    whatsappPlaceholder: "WhatsApp number * (e.g. +306912345678)",
    emailPlaceholder:    "Email (optional)",
    notesPlaceholder:    "Notes or preferred time (optional)",
    consentText:         "I agree to be contacted via WhatsApp regarding my inquiry.",
    submitLabel:         "Send",
    submittingLabel:     "Sending…",
    successText:         "Thank you. Your request has been forwarded. Our advisory team will contact you via WhatsApp.",
    nameRequired:        "Name is required",
    whatsappRequired:    "WhatsApp number is required",
    whatsappFormat:      "Include country code, no spaces (e.g. +306912345678)",
    emailInvalid:        "Enter a valid email address",
    consentRequired:     "Please confirm your consent to continue",
    timeoutError:        "Request timed out — please try again",
    networkError:        "Network error — please try again",
    submitError:         "Submission failed — please try again",
    rateLimitMsg:        "Too many messages. Please wait a moment and try again.",
    refusalMsg:          "I can only assist with advisory within the verified 1Choice portfolio.",
  },
  ru: {
    namePlaceholder:     "Ваше имя *",
    whatsappPlaceholder: "Номер WhatsApp * (например, +306912345678)",
    emailPlaceholder:    "Email (необязательно)",
    notesPlaceholder:    "Примечания или удобное время (необязательно)",
    consentText:         "Я согласен(на) на связь через WhatsApp по моему запросу.",
    submitLabel:         "Отправить",
    submittingLabel:     "Отправка…",
    successText:         "Спасибо. Ваш запрос передан. Наш консультант свяжется с вами через WhatsApp.",
    nameRequired:        "Имя обязательно",
    whatsappRequired:    "Номер WhatsApp обязателен",
    whatsappFormat:      "Укажите код страны, без пробелов (например, +306912345678)",
    emailInvalid:        "Введите корректный адрес email",
    consentRequired:     "Пожалуйста, подтвердите согласие для продолжения",
    timeoutError:        "Время запроса истекло — попробуйте ещё раз",
    networkError:        "Ошибка сети — попробуйте ещё раз",
    submitError:         "Ошибка отправки — попробуйте ещё раз",
    rateLimitMsg:        "Слишком много сообщений. Пожалуйста, подождите.",
    refusalMsg:          "Я могу помочь только с объектами из подтверждённого портфолио 1Choice.",
  },
  el: {
    namePlaceholder:     "Το όνομά σας *",
    whatsappPlaceholder: "Αριθμός WhatsApp * (π.χ. +306912345678)",
    emailPlaceholder:    "Email (προαιρετικό)",
    notesPlaceholder:    "Σημειώσεις ή προτιμώμενη ώρα (προαιρετικό)",
    consentText:         "Συμφωνώ να επικοινωνήσετε μαζί μου μέσω WhatsApp σχετικά με το αίτημά μου.",
    submitLabel:         "Αποστολή",
    submittingLabel:     "Αποστολή…",
    successText:         "Ευχαριστούμε. Το αίτημά σας διαβιβάστηκε. Η ομάδα μας θα επικοινωνήσει μαζί σας μέσω WhatsApp.",
    nameRequired:        "Το όνομα είναι υποχρεωτικό",
    whatsappRequired:    "Ο αριθμός WhatsApp είναι υποχρεωτικός",
    whatsappFormat:      "Συμπεριλάβετε τον κωδικό χώρας, χωρίς κενά (π.χ. +306912345678)",
    emailInvalid:        "Εισάγετε έγκυρη διεύθυνση email",
    consentRequired:     "Παρακαλώ επιβεβαιώστε τη συγκατάθεσή σας για να συνεχίσετε",
    timeoutError:        "Το αίτημα έληξε — δοκιμάστε ξανά",
    networkError:        "Σφάλμα δικτύου — δοκιμάστε ξανά",
    submitError:         "Αποτυχία αποστολής — δοκιμάστε ξανά",
    rateLimitMsg:        "Πολλά μηνύματα. Περιμένετε λίγο και δοκιμάστε ξανά.",
    refusalMsg:          "Μπορώ να βοηθήσω μόνο με συμβουλευτικές υπηρεσίες για το επαληθευμένο χαρτοφυλάκιο 1Choice.",
  },
  ar: {
    namePlaceholder:     "اسمك *",
    whatsappPlaceholder: "رقم واتساب * (مثلاً +306912345678)",
    emailPlaceholder:    "البريد الإلكتروني (اختياري)",
    notesPlaceholder:    "ملاحظات أو وقت مناسب (اختياري)",
    consentText:         "أوافق على التواصل معي عبر واتساب بخصوص استفساري.",
    submitLabel:         "إرسال",
    submittingLabel:     "جارٍ الإرسال…",
    successText:         "شكراً لك. تم إرسال طلبك. سيتواصل معك فريقنا الاستشاري عبر واتساب.",
    nameRequired:        "الاسم مطلوب",
    whatsappRequired:    "رقم واتساب مطلوب",
    whatsappFormat:      "أدخل رمز البلد بدون مسافات (مثلاً +306912345678)",
    emailInvalid:        "أدخل بريداً إلكترونياً صحيحاً",
    consentRequired:     "يرجى تأكيد موافقتك للمتابعة",
    timeoutError:        "انتهت مهلة الطلب — يرجى المحاولة مجدداً",
    networkError:        "خطأ في الشبكة — يرجى المحاولة مجدداً",
    submitError:         "فشل الإرسال — يرجى المحاولة مجدداً",
    rateLimitMsg:        "رسائل كثيرة جداً. يرجى الانتظار قليلاً والمحاولة مجدداً.",
    refusalMsg:          "يمكنني المساعدة فقط في الاستشارات المتعلقة بمحفظة 1Choice المعتمدة.",
  },
  he: {
    namePlaceholder:     "שמך *",
    whatsappPlaceholder: "מספר WhatsApp * (למשל +306912345678)",
    emailPlaceholder:    "דוא\"ל (אופציונלי)",
    notesPlaceholder:    "הערות או זמן מועדף (אופציונלי)",
    consentText:         "אני מסכים/ה ליצירת קשר איתי דרך WhatsApp בנוגע לפנייתי.",
    submitLabel:         "שלח",
    submittingLabel:     "שולח…",
    successText:         "תודה. פנייתך הועברה. צוות הייעוץ שלנו יצור איתך קשר דרך WhatsApp.",
    nameRequired:        "שם הוא שדה חובה",
    whatsappRequired:    "מספר WhatsApp הוא שדה חובה",
    whatsappFormat:      "כלול קידומת מדינה, ללא רווחים (למשל +306912345678)",
    emailInvalid:        "הזן כתובת דוא\"ל תקינה",
    consentRequired:     "אנא אשר/י את הסכמתך להמשיך",
    timeoutError:        "הבקשה פג תוקפה — נסה/י שוב",
    networkError:        "שגיאת רשת — נסה/י שוב",
    submitError:         "השליחה נכשלה — נסה/י שוב",
    rateLimitMsg:        "יותר מדי הודעות. המתן/י רגע ונסה/י שוב.",
    refusalMsg:          "אני יכול/ה לסייע רק בייעוץ לגבי תיק הנכסים המאומת של 1Choice.",
  },
};

export function getFormStrings(lang: ChatLang): FormStrings {
  return STRINGS[lang];
}
