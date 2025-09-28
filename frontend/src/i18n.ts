import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'hi', label: 'हिन्दी', nativeName: 'हिन्दी' },
  { code: 'bn', label: 'বাংলা', nativeName: 'বাংলা' },
  { code: 'mr', label: 'मराठी', nativeName: 'मराठी' },
  { code: 'ta', label: 'தமிழ்', nativeName: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు', nativeName: 'తెలుగు' }
];

const STORAGE_KEY = 'yieldwise.lang';
const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;

const resources = {
  en: {
    translation: {
      common: { more: 'More', less: 'Less' },
      header: {
        appName: 'YieldWise',
        tagline: 'Smart AI-powered farming',
        optimalWindow: 'Optimal growing window',
        aiRefreshed: 'AI insights refreshed',
        themeToggle: {
          light: 'Switch to light mode',
          dark: 'Switch to dark mode'
        },
        notifications: 'Notifications',
        languageLabel: 'Language',
        menu: {
          profilePrimary: 'Profile',
          profileSecondary: 'Grower profile',
          logout: 'Sign out'
        }
      },
      sidebar: {
        navigation: 'Navigation',
        items: {
          dashboard: 'Dashboard',
          cropPredictor: 'Crop Predictor',
          diseaseDetector: 'Disease Detector',
          financialDashboard: 'Financial Dashboard',
          marketIntelligence: 'Market Intelligence',
          mandiData: 'Mandi Data',
          communityForum: 'Community Forum',
          chatbot: 'AI Chatbot',
          multilingualChat: 'Multilingual Chat'
        },
        tips: {
          title: 'Smart farming tips',
          subtitle: 'Stay ahead with weather alerts and market signals',
          cta: "View today's insights"
        }
      },
      dashboard: {
        hero: {
          badge: 'Live intelligence',
          title: 'Steering smarter fields with real-time intelligence',
          subtitle: 'YieldWise unites crop prediction, disease diagnostics, price intelligence, and farmer collaboration into one simple workspace.',
          primaryCta: 'Open crop predictor',
          secondaryCta: 'Ask the AI agronomist'
        },
        weather: {
          title: 'Field weather snapshot',
          loading: 'Loading weather...',
          errors: {
            fetch: 'Failed to fetch weather data',
            denied: 'Location access denied. Showing default weather.',
            unsupported: 'Geolocation is not supported in this browser.'
          },
          locationFallback: 'Location unavailable',
          descriptionFallback: 'Weather data unavailable',
          humidity: 'Humidity {{value}}%'
        },
        stats: {
          loading: 'Loading stats...',
          items: {
            success: {
              label: 'Successful predictions',
              delta: '+12% this week'
            },
            farms: {
              label: 'Farms optimized',
              delta: '+48 new partners'
            },
            risk: {
              label: 'Risk alerts resolved',
              delta: 'Response time ↓ 18%'
            }
          }
        },
        quickInsights: {
          irrigation: 'Irrigation schedule synced',
          mandi: 'New mandi price bulletin ready'
        },
        yield: {
          title: 'Yield outlook',
          description: 'Projected yield trajectory combining soil telemetry, satellite weather, and historical trends.'
        },
        soil: {
          title: 'Soil health signals',
          description: 'Track nutrient balance, pest pressure, and weather risks in one panel.',
          signals: {
            moisture: {
              title: 'Soil moisture',
              state: 'Optimal'
            },
            nutrients: {
              title: 'Nutrient balance',
              state: 'Add organic matter'
            },
            pest: {
              title: 'Pest pressure',
              state: 'Scouting recommended next week'
            },
            weather: {
              title: 'Weather risk',
              state: 'High winds predicted Friday'
            }
          }
        },
        readiness: {
          title: 'Field readiness signals',
          description: 'Automated agronomy checks compiled from IoT probes and scouting updates across your farms.',
          loading: 'Loading soil data...'
        },
        modules: {
          title: 'Explore modules',
          description: 'Navigate to a workspace and continue where you left off. Actions auto-sync across devices.',
          cropPredictor: {
            title: 'Crop Predictor',
            description: 'Personalized yield simulations and seasonal planning.'
          },
          diseaseDetector: {
            title: 'Disease Detector',
            description: 'Upload plant imagery and get AI-driven diagnostics.'
          },
          financialDashboard: {
            title: 'Financial Dashboard',
            description: 'ROI calculators, price intelligence, and market alerts.'
          },
          communityForum: {
            title: 'Community Forum',
            description: 'Multilingual knowledge shares from growers worldwide.'
          },
          chatbot: {
            title: 'AI Assistant',
            description: 'Conversational agronomy with context-aware insights.'
          }
        },
        months: {
          mar: 'Mar',
          apr: 'Apr',
          may: 'May',
          jun: 'Jun',
          jul: 'Jul',
          aug: 'Aug',
          sep: 'Sep'
        }
      },
      cropPredictor: {
        hero: {
          title: 'Smart Crop Yield Planner',
          tagline: 'Farmer-friendly • Mobile-first • Insight rich',
          subtitle: 'Enter soil health, weather, and crop choices. We translate the prediction into actions you can take in the field.',
          predictBtn: 'Predict Yield',
          predicting: 'Predicting…',
          resetBtn: 'Reset Inputs'
        },
        form: {
          sectionTitle: 'Field & soil details',
          sectionSubtitle: 'Select crop, state, and season, then fine-tune weather and nutrient inputs.',
          sectionTooltip: 'These basics help us align your field with similar farms for better accuracy.',
          fields: {
            crop: 'Crop',
            state: 'State',
            season: 'Season',
            year: 'Season year',
            area: 'Field area',
            annualRainfall: 'Annual rainfall',
            fertilizer: 'Fertilizer',
            pesticide: 'Pesticide',
            nitrogen: 'Nitrogen',
            phosphorus: 'Phosphorus',
            potassium: 'Potassium'
          },
          sliders: {
            title: 'Quick adjustments',
            temperature: 'Temperature',
            humidity: 'Humidity',
            soilPh: 'Soil pH',
            seasonalRainfall: 'Seasonal rainfall',
            helpers: {
              temperature: 'Average daytime field temperature',
              humidity: 'Relative humidity during crop cycle',
              soilPh: 'Soil acidity or alkalinity level',
              seasonalRainfall: 'Rainfall expected across the growing season'
            }
          },
          buttons: {
            predict: 'Predict Yield',
            predicting: 'Predicting…',
            train: 'Train Model',
            training: 'Training…',
            reset: 'Reset'
          }
        },
        results: {
          title: 'Projected yield',
          areaChip: 'Area {{value}} ha',
          confidence: 'Confidence {{value}}%',
          range: 'Likely range: {{lower}} – {{upper}} {{unit}}',
          tipsHeading: 'Quick field nudges',
          emptyTitle: 'Your yield will appear here',
          emptySubtitle: 'Fill in the inputs and tap Predict Yield. We will place the harvest estimate and tips here.',
          emptyHighlightChip: 'Highlight yield',
          emptyTipsChip: 'Actionable tips',
          error: 'Prediction failed. Please review inputs and try again.',
          aiHeading: 'Gemini yield recommendations',
          aiUnavailable: 'Recommendations unavailable right now.',
          aiLanguageChip: 'AI language: {{lang}}',
          aiRefreshingChip: 'Updating AI tips…',
          aiSections: {
            yield_assessment: 'Yield assessment',
            fertilizer_recommendations: {
              title: 'Fertilizer recommendations',
              optimal_npk: 'Optimal NPK',
              application_schedule: 'Application schedule',
              organic_options: 'Organic options',
              micronutrients: 'Micronutrients'
            },
            irrigation_recommendations: {
              title: 'Irrigation recommendations',
              frequency: 'Frequency',
              critical_stages: 'Critical stages',
              methods: 'Methods',
              water_management: 'Water management'
            },
            planting_recommendations: {
              title: 'Planting recommendations',
              optimal_dates: 'Optimal dates',
              variety_selection: 'Variety selection',
              spacing: 'Spacing',
              soil_prep: 'Soil preparation'
            },
            improvement_potential: {
              title: 'Improvement potential',
              expected_increase: 'Expected increase',
              timeline: 'Timeline',
              priority_actions: 'Priority actions',
              investment_needed: 'Investment needed'
            },
            cost_benefit: {
              title: 'Cost / Benefit',
              roi_estimate: 'ROI estimate',
              payback_period: 'Payback period',
              risk_factors: 'Risk factors'
            }
          }
        },
        snapshot: {
          title: 'Soil & weather snapshot',
          nutrientActual: 'Actual',
          nutrientIdeal: 'Ideal',
          weatherIdeal: 'Ideal',
          weatherActual: 'Your field'
        },
        features: {
          title: 'What drove this prediction?'
        },
        extras: {
          title: 'Farmer-first extras we recommend next',
          offline: {
            title: 'Offline mode',
            description: 'Save latest predictions offline so farmers can review without network coverage.'
          },
          languages: {
            title: 'Local languages',
            description: 'Offer the interface in regional languages with optional audio hints.'
          },
          health: {
            title: 'Crop health watch',
            description: 'Daily tips on pest and disease alerts based on humidity, rainfall, and crop stage.'
          },
          weather: {
            title: 'Weather-aware reminders',
            description: 'Push timely alerts to irrigate, spray, or harvest when weather demands action.'
          }
        },
        tips: {
          phLow: 'Soil is acidic; consider adding lime or organic compost to balance pH.',
          phHigh: 'Soil is alkaline; add organic matter or gypsum to bring pH near 6.5-7.',
          nitrogenLow: 'Nitrogen is low—add urea or green manure to boost growth.',
          phosphorusLow: 'Phosphorus is low; single super phosphate can support roots.',
          potassiumLow: 'Potassium is low; apply potash to strengthen stems and disease resistance.',
          humidityHigh: 'High humidity—monitor for fungal disease and keep airflow moving.',
          rainfallLow: 'Low rainfall—plan supplemental irrigation or mulching.',
          fertilizerHigh: 'Fertilizer rate is high; split doses to reduce nutrient loss.'
        },
        alerts: {
          predictSuccess: 'Prediction ready with fresh insights!',
          predictFailure: 'Prediction failed. Please review inputs and try again.',
          predictError: 'Server error during prediction.',
          trainSuccess: 'Model training has started.',
          trainFailure: 'Training failed. Please try again later.',
          trainError: 'Server error during training.',
          refreshingAI: 'Refreshing AI recommendations in {{language}}…',
          aiRefreshed: 'AI recommendations updated in {{language}}.'
        }
      }
    }
  },
  hi: {
    translation: {
      common: { more: 'और', less: 'कम' },
      header: {
        appName: 'YieldWise',
        tagline: 'स्मार्ट एआई संचालित खेती',
        optimalWindow: 'उत्तम बढ़वार अवधि',
        aiRefreshed: 'एआई इनसाइट्स अपडेट हुए',
        themeToggle: {
          light: 'लाइट मोड पर जाएँ',
          dark: 'डार्क मोड पर जाएँ'
        },
        notifications: 'सूचनाएँ',
        languageLabel: 'भाषा',
        menu: {
          profilePrimary: 'प्रोफ़ाइल',
          profileSecondary: 'कृषक प्रोफ़ाइल',
          settings: 'कार्यस्थल सेटिंग्स',
          logout: 'साइन आउट'
        }
      },
      sidebar: {
        navigation: 'नेविगेशन',
        items: {
          dashboard: 'डैशबोर्ड',
          cropPredictor: 'फ़सल अनुमान',
          diseaseDetector: 'रोग पहचान',
          financialDashboard: 'वित्तीय डैशबोर्ड',
          marketIntelligence: 'बाज़ार इनसाइट्स',
          mandiData: 'मंडी डेटा',
          communityForum: 'सामुदायिक मंच',
          chatbot: 'एआई चैटबॉट',
          multilingualChat: 'बहुभाषी चैट'
        },
        tips: {
          title: 'स्मार्ट खेती सुझाव',
          subtitle: 'मौसम अलर्ट और बाज़ार संकेतों से आगे रहें',
          cta: 'आज के इनसाइट्स देखें'
        }
      },
      dashboard: {
        hero: {
          badge: 'लाइव इनसाइट्स',
          title: 'रीयल-टाइम बुद्धिमत्ता से खेतों को दिशा दें',
          subtitle: 'YieldWise फ़सल अनुमान, रोग निदान, मूल्य जानकारी और किसान सहयोग को एक सहज मंच पर लाता है।',
          primaryCta: 'फ़सल अनुमान खोलें',
          secondaryCta: 'एआई कृषि विशेषज्ञ से पूछें'
        },
        weather: {
          title: 'खेत मौसम त्वरित झलक',
          loading: 'मौसम लोड हो रहा है...',
          errors: {
            fetch: 'मौसम डेटा प्राप्त नहीं हो सका',
            denied: 'स्थान अनुमति नहीं मिली। डिफ़ॉल्ट मौसम दिखा रहे हैं।',
            unsupported: 'यह ब्राउज़र भू-स्थान समर्थन नहीं करता।'
          },
          locationFallback: 'स्थान उपलब्ध नहीं',
          descriptionFallback: 'मौसम डेटा उपलब्ध नहीं',
          humidity: 'आर्द्रता {{value}}%'
        },
        stats: {
          loading: 'आँकड़े लोड हो रहे हैं...',
          items: {
            success: {
              label: 'सफल अनुमान',
              delta: 'इस हफ्ते +12%'
            },
            farms: {
              label: 'अनुकूलित खेत',
              delta: '+48 नए भागीदार'
            },
            risk: {
              label: 'जोखिम अलर्ट हल',
              delta: 'प्रतिक्रिया समय ↓ 18%'
            }
          }
        },
        quickInsights: {
          irrigation: 'सिंचाई अनुसूची सिंक',
          mandi: 'नई मंडी मूल्य बुलेटिन तैयार'
        },
        yield: {
          title: 'उपज दृष्टिकोण',
          description: 'मृदा, मौसम और इतिहास से उपज प्रक्षेपित आँकड़े।'
        },
        soil: {
          title: 'मृदा स्वास्थ्य संकेत',
          description: 'पोषक संतुलन, कीट दबाव और मौसम जोखिम एक ही पैनल में देखें।',
          signals: {
            moisture: {
              title: 'मृदा नमी',
              state: 'उत्तम'
            },
            nutrients: {
              title: 'पोषक संतुलन',
              state: 'जैविक पदार्थ जोड़ें'
            },
            pest: {
              title: 'कीट दबाव',
              state: 'अगले सप्ताह निगरानी की सलाह'
            },
            weather: {
              title: 'मौसम जोखिम',
              state: 'शुक्रवार को तेज़ हवाओं की संभावना'
            }
          }
        },
        readiness: {
          title: 'खेत तैयारियों के संकेत',
          description: 'आईओटी प्रोब और सर्वेक्षण अपडेट से स्वचालित कृषि जांच।',
          loading: 'मृदा डेटा लोड हो रहा है...'
        },
        modules: {
          title: 'मॉड्यूल्स खोजें',
          description: 'जहाँ छोड़ा था वहीं से काम जारी रखें; क्रियाएँ स्वतः सिंक होती हैं।',
          cropPredictor: {
            title: 'फ़सल अनुमान',
            description: 'व्यक्तिगत उपज सिमुलेशन और मौसमी योजना।'
          },
          diseaseDetector: {
            title: 'रोग पहचान',
            description: 'पौधों की छवियाँ अपलोड करें और एआई निदान प्राप्त करें।'
          },
          financialDashboard: {
            title: 'वित्तीय डैशबोर्ड',
            description: 'आरओआई कैलकुलेटर, मूल्य जानकारी और बाजार अलर्ट।'
          },
          communityForum: {
            title: 'सामुदायिक मंच',
            description: 'दुनिया भर के किसानों से बहुभाषी ज्ञान साझाकरण।'
          },
          chatbot: {
            title: 'एआई सहायक',
            description: 'संदर्भ-सक्षम एआई कृषि संवाद साथी।'
          }
        },
        months: {
          mar: 'मार्च',
          apr: 'अप्रैल',
          may: 'मई',
          jun: 'जून',
          jul: 'जुलाई',
          aug: 'अगस्त',
          sep: 'सितंबर'
        }
      },
      cropPredictor: {
        hero: {
          title: 'स्मार्ट फ़सल उपज योजनाकार',
          tagline: 'किसान-अनुकूल • मोबाइल-प्रथम • गहन इनसाइट्स',
          subtitle: 'मृदा, मौसम और फ़सल विवरण दर्ज करें। हम भविष्यवाणी को ऐसे कार्यों में बदलते हैं जिन्हें खेत पर लागू किया जा सके।',
          predictBtn: 'उपज अनुमान लगाएँ',
          predicting: 'अनुमान चल रहा है…',
          resetBtn: 'इनपुट रीसेट करें'
        },
        form: {
          sectionTitle: 'खेत और मृदा विवरण',
          sectionSubtitle: 'फ़सल, राज्य और मौसम चुनें तथा मौसम और पोषक मान समायोजित करें।',
          sectionTooltip: 'ये मूल जानकारी मॉडल को आपके खेत की तुलना समान खेतों से करने में मदद करती है।',
          fields: {
            crop: 'फ़सल',
            state: 'राज्य',
            season: 'मौसम',
            year: 'मौसम वर्ष',
            area: 'खेत का क्षेत्र',
            annualRainfall: 'वार्षिक वर्षा',
            fertilizer: 'उर्वरक',
            pesticide: 'कीटनाशक',
            nitrogen: 'नाइट्रोजन',
            phosphorus: 'फॉस्फोरस',
            potassium: 'पोटाश'
          },
          sliders: {
            title: 'त्वरित समायोजन',
            temperature: 'तापमान',
            humidity: 'आर्द्रता',
            soilPh: 'मृदा pH',
            seasonalRainfall: 'मौसमी वर्षा',
            helpers: {
              temperature: 'औसत दिन का तापमान',
              humidity: 'कृषि अवधि के दौरान आर्द्रता',
              soilPh: 'मृदा की अम्लता या क्षारीयता',
              seasonalRainfall: 'पूरा मौसम अपेक्षित वर्षा'
            }
          },
          buttons: {
            predict: 'उपज अनुमान लगाएँ',
            predicting: 'अनुमान चल रहा है…',
            train: 'मॉडल प्रशिक्षित करें',
            training: 'प्रशिक्षण जारी…',
            reset: 'रीसेट'
          }
        },
        results: {
          title: 'अनुमानित उपज',
          areaChip: 'क्षेत्र {{value}} हेक्टेयर',
          confidence: 'विश्वास स्तर {{value}}%',
          range: 'संभावित सीमा: {{lower}} – {{upper}} {{unit}}',
          tipsHeading: 'त्वरित खेत सुझाव',
          emptyTitle: 'आपकी उपज यहाँ दिखाई देगी',
          emptySubtitle: 'इनपुट भरें और “उपज अनुमान लगाएँ” दबाएँ। हम परिणाम और सुझाव यही दिखाएँगे।',
          emptyHighlightChip: 'उपज हाइलाइट',
          emptyTipsChip: 'कार्यान्वित सुझाव',
          error: 'अनुमान विफल रहा। कृपया इनपुट जाँचें और पुनः प्रयास करें।',
          aiHeading: 'Gemini उपज सिफारिशें',
          aiUnavailable: 'सिफारिशें अभी उपलब्ध नहीं हैं।',
          aiLanguageChip: 'एआई भाषा: {{lang}}',
          aiRefreshingChip: 'एआई सुझाव अपडेट हो रहे हैं…'
        },
        snapshot: {
          title: 'मृदा एवं मौसम झलक',
          nutrientActual: 'वास्तविक',
          nutrientIdeal: 'आदर्श',
          weatherIdeal: 'आदर्श',
          weatherActual: 'आपका खेत'
        },
        features: {
          title: 'यह अनुमान किन कारणों से बना?'
        },
        extras: {
          title: 'किसानों के लिए अगला बढ़िया कदम',
          offline: {
            title: 'ऑफलाइन मोड',
            description: 'बिना नेटवर्क के भी नवीनतम परिणाम देखें।'
          },
          languages: {
            title: 'स्थानीय भाषाएँ',
            description: 'लोकप्रिय भारतीय भाषाओं में इंटरफ़ेस और ऑडियो गाइड प्रदान करें।'
          },
          health: {
            title: 'फ़सल स्वास्थ्य निगरानी',
            description: 'आर्द्रता, वर्षा और विकास चरण के आधार पर प्रतिदिन रोग व कीट अलर्ट।'
          },
          weather: {
            title: 'मौसम सचेत अनुस्मारक',
            description: 'सिंचाई, छिड़काव या कटाई के लिए समय पर अलर्ट भेजें।'
          }
        },
        tips: {
          phLow: 'मृदा अम्लीय है; pH संतुलन के लिए चूना या जैविक खाद डालें।',
          phHigh: 'मृदा क्षारीय है; pH को 6.5-7 के करीब लाने के लिए जैविक पदार्थ या जिप्सम जोड़ें।',
          nitrogenLow: 'नाइट्रोजन कम है—विकास के लिए यूरिया या हरी खाद डालें।',
          phosphorusLow: 'फॉस्फोरस कम है; जड़ों हेतु सिंगल सुपर फॉस्फेट उपयोग करें।',
          potassiumLow: 'पोटाश कम है; तनों को मजबूत करने हेतु पोटाश खाद दें।',
          humidityHigh: 'ऊँची आर्द्रता—फंगल रोगों पर नज़र रखें और वेंटिलेशन सुनिश्चित करें।',
          rainfallLow: 'कम वर्षा—अतिरिक्त सिंचाई या मल्चिंग की योजना बनाएं।',
          fertilizerHigh: 'उर्वरक दर अधिक है; पोषक हानि घटाने हेतु खुराक को विभाजित करें।'
        },
        alerts: {
          predictSuccess: 'उपज अनुमान तैयार है!',
          predictFailure: 'अनुमान विफल रहा। कृपया इनपुट जाँचें।',
          predictError: 'अनुमान के दौरान सर्वर त्रुटि।',
          trainSuccess: 'मॉडल प्रशिक्षण शुरू हो गया है।',
          trainFailure: 'प्रशिक्षण विफल रहा। बाद में पुनः प्रयास करें।',
          trainError: 'प्रशिक्षण के दौरान सर्वर त्रुटि।',
          refreshingAI: '{{language}} में एआई सिफारिशें अपडेट हो रही हैं…',
          aiRefreshed: '{{language}} में एआई सिफारिशें अपडेट हो गईं।'
        }
      }
    }
  },
  bn: {
    translation: {
      common: { more: 'আরও', less: 'কম' },
      header: {
        appName: 'YieldWise',
        tagline: 'স্মার্ট এআই চালিত কৃষি',
        optimalWindow: 'সেরা বৃদ্ধির সময়কাল',
        aiRefreshed: 'এআই অন্তর্দৃষ্টি হালনাগাদ',
        themeToggle: {
          light: 'লাইট মোডে যান',
          dark: 'ডার্ক মোডে যান'
        },
        notifications: 'নোটিফিকেশন',
        languageLabel: 'ভাষা',
        menu: {
          profilePrimary: 'প্রোফাইল',
          profileSecondary: 'কৃষক প্রোফাইল',
          settings: 'ওয়ার্কস্পেস সেটিংস',
          logout: 'সাইন আউট'
        }
      },
      sidebar: {
        navigation: 'নেভিগেশন',
        items: {
          dashboard: 'ড্যাশবোর্ড',
          cropPredictor: 'ফসল পূর্বাভাস',
          diseaseDetector: 'রোগ শনাক্তকরণ',
          financialDashboard: 'আর্থিক ড্যাশবোর্ড',
          marketIntelligence: 'বাজার অন্তর্দৃষ্টি',
          mandiData: 'মান্ডি ডেটা',
          communityForum: 'কমিউনিটি ফোরাম',
          chatbot: 'এআই চ্যাটবট',
          multilingualChat: 'বহুভাষিক চ্যাট'
        },
        tips: {
          title: 'স্মার্ট চাষাবাদ টিপস',
          subtitle: 'আবহাওয়ার সতর্কতা ও বাজার সংকেতে এগিয়ে থাকুন',
          cta: 'আজকের অন্তর্দৃষ্টি দেখুন'
        }
      },
      dashboard: {
        hero: {
          badge: 'লাইভ অন্তর্দৃষ্টি',
          title: 'রিয়েল-টাইম বুদ্ধিমত্তায় স্মার্ট মাঠ পরিচালনা',
          subtitle: 'YieldWise ফসল পূর্বাভাস, রোগ নির্ণয়, মূল্য তথ্য এবং কৃষক সহযোগিতাকে এক প্ল্যাটফর্মে আনে।',
          primaryCta: 'ফসল পূর্বাভাস খুলুন',
          secondaryCta: 'এআই কৃষিবিদকে জিজ্ঞাসা করুন'
        },
        weather: {
          title: 'মাঠের আবহাওয়ার ঝটপট ঝলক',
          loading: 'আবহাওয়া লোড হচ্ছে...',
          errors: {
            fetch: 'আবহাওয়ার তথ্য আনা যায়নি',
            denied: 'অবস্থান অনুমতি পাওয়া যায়নি। ডিফল্ট আবহাওয়া দেখানো হচ্ছে।',
            unsupported: 'এই ব্রাউজারে ভূ-অবস্থান সমর্থিত নয়।'
          },
          locationFallback: 'অবস্থান অজানা',
          descriptionFallback: 'আবহাওয়ার তথ্য উপলভ্য নয়',
          humidity: 'আর্দ্রতা {{value}}%'
        },
        stats: {
          loading: 'পরিসংখ্যান লোড হচ্ছে...',
          items: {
            success: {
              label: 'সফল পূর্বাভাস',
              delta: 'এই সপ্তাহে +১২%'
            },
            farms: {
              label: 'উন্নত খামার',
              delta: '+৪৮ নতুন অংশীদার'
            },
            risk: {
              label: 'ঝুঁকি সতর্কতা সমাধান',
              delta: 'প্রতিক্রিয়া সময় ↓ ১৮%'
            }
          }
        },
        quickInsights: {
          irrigation: 'সেচ সময়সূচি সমন্বিত',
          mandi: 'নতুন মান্ডি মূল্য বিজ্ঞপ্তি প্রস্তুত'
        },
        yield: {
          title: 'উৎপাদন সম্ভাবনা',
          description: 'মাটি, আবহাওয়া ও ইতিহাস মিলিয়ে সম্ভাব্য উৎপাদন প্রবণতা।'
        },
        soil: {
          title: 'মাটির স্বাস্থ্য সংকেত',
          description: 'পুষ্টি ভারসাম্য, পোকা চাপ ও আবহাওয়া ঝুঁকি এক জায়গায় দেখুন।',
          signals: {
            moisture: {
              title: 'মাটির আর্দ্রতা',
              state: 'সর্বোত্তম'
            },
            nutrients: {
              title: 'পুষ্টি ভারসাম্য',
              state: 'জৈব পদার্থ যোগ করুন'
            },
            pest: {
              title: 'পোকার চাপ',
              state: 'আগামী সপ্তাহে নজরদারি করুন'
            },
            weather: {
              title: 'আবহাওয়া ঝুঁকি',
              state: 'শুক্রবার প্রবল হাওয়ার সতর্কতা'
            }
          }
        },
        readiness: {
          title: 'খামার প্রস্তুতি সংকেত',
          description: 'আইওটি প্রোব ও স্কাউটিং আপডেট থেকে স্বয়ংক্রিয় কৃষি পরীক্ষা।',
          loading: 'মাটির তথ্য লোড হচ্ছে...'
        },
        modules: {
          title: 'মডিউলগুলি অন্বেষণ করুন',
          description: 'যেখানে থেমেছিলেন সেখান থেকে চালিয়ে যান; কার্যগুলি স্বয়ংক্রিয়ভাবে সিঙ্ক হয়।',
          cropPredictor: {
            title: 'ফসল পূর্বাভাস',
            description: 'ব্যক্তিগত উৎপাদন সিমুলেশন ও মৌসুমি পরিকল্পনা।'
          },
          diseaseDetector: {
            title: 'রোগ শনাক্তকরণ',
            description: 'গাছের ছবি আপলোড করুন এবং এআই-চালিত নির্ণয় নিন।'
          },
          financialDashboard: {
            title: 'আর্থিক ড্যাশবোর্ড',
            description: 'আরওআই ক্যালকুলেটর, মূল্য তথ্য ও বাজার সতর্কতা।'
          },
          communityForum: {
            title: 'কমিউনিটি ফোরাম',
            description: 'বিশ্বব্যাপী কৃষকদের বহুভাষিক জ্ঞান ভাগাভাগি।'
          },
          chatbot: {
            title: 'এআই সহকারী',
            description: 'প্রসঙ্গ সচেতন এআই কৃষি কথোপকথন।'
          }
        },
        months: {
          mar: 'মার্চ',
          apr: 'এপ্রিল',
          may: 'মে',
          jun: 'জুন',
          jul: 'জুলাই',
          aug: 'আগস্ট',
          sep: 'সেপ্টেম্বর'
        }
      },
      cropPredictor: {
        hero: {
          title: 'স্মার্ট ফসল উৎপাদন পরিকল্পক',
          tagline: 'কৃষক-বান্ধব • মোবাইল-প্রথম • গভীর অন্তর্দৃষ্টি',
          subtitle: 'মাটি, আবহাওয়া ও ফসলের তথ্য দিন। আমরা ফলাফলকে সরাসরি মাঠে প্রয়োগযোগ্য করণীয়তে রূপান্তর করি।',
          predictBtn: 'উৎপাদন অনুমান করুন',
          predicting: 'অনুমান চলছে…',
          resetBtn: 'ইনপুট রিসেট করুন'
        },
        form: {
          sectionTitle: 'মাঠ ও মাটির তথ্য',
          sectionSubtitle: 'ফসল, রাজ্য, মৌসুম বেছে নিন এবং আবহাওয়া ও পুষ্টি মান সমন্বয় করুন।',
          sectionTooltip: 'এই মৌলিক তথ্য আমাদের আপনার মাঠকে অনুরূপ খামারগুলির সাথে তুলনা করতে সাহায্য করে।',
          fields: {
            crop: 'ফসল',
            state: 'রাজ্য',
            season: 'মৌসুম',
            year: 'মৌসুম বছর',
            area: 'মাঠের আয়তন',
            annualRainfall: 'বার্ষিক বৃষ্টিপাত',
            fertilizer: 'সার',
            pesticide: 'কীটনাশক',
            nitrogen: 'নাইট্রোজেন',
            phosphorus: 'ফসফরাস',
            potassium: 'পটাশ'
          },
          sliders: {
            title: 'দ্রুত সামঞ্জস্য',
            temperature: 'তাপমাত্রা',
            humidity: 'আর্দ্রতা',
            soilPh: 'মাটির pH',
            seasonalRainfall: 'মৌসুমি বৃষ্টিপাত',
            helpers: {
              temperature: 'দিনের গড় তাপমাত্রা',
              humidity: 'চাষ মৌসুমে আপেক্ষিক আর্দ্রতা',
              soilPh: 'মাটির অম্লতা বা ক্ষারত্ব',
              seasonalRainfall: 'পুরো মৌসুমে প্রত্যাশিত বৃষ্টিপাত'
            }
          },
          buttons: {
            predict: 'উৎপাদন অনুমান করুন',
            predicting: 'অনুমান চলছে…',
            train: 'মডেল প্রশিক্ষণ',
            training: 'প্রশিক্ষণ চলছে…',
            reset: 'রিসেট'
          }
        },
        results: {
          title: 'প্রাক্কলিত উৎপাদন',
          areaChip: 'আয়তন {{value}} হেক্টর',
          confidence: 'বিশ্বাসযোগ্যতা {{value}}%',
          range: 'সম্ভাব্য সীমা: {{lower}} – {{upper}} {{unit}}',
          tipsHeading: 'দ্রুত মাঠ টিপস',
          emptyTitle: 'এখানে উৎপাদন দেখাবে',
          emptySubtitle: 'ইনপুট পূরণ করে “উৎপাদন অনুমান করুন” চাপুন। ফলাফল ও টিপস এখানে দেখাবে।',
          emptyHighlightChip: 'উৎপাদন হাইলাইট',
          emptyTipsChip: 'কার্যকর টিপস',
          error: 'অনুমান ব্যর্থ। অনুগ্রহ করে ইনপুট পরীক্ষা করুন।',
          aiHeading: 'Gemini উৎপাদন পরামর্শ',
          aiUnavailable: 'পরামর্শ এই মুহূর্তে পাওয়া যাচ্ছে না।',
          aiLanguageChip: 'এআই ভাষা: {{lang}}',
          aiRefreshingChip: 'এআই পরামর্শ হালনাগাদ হচ্ছে…'
        },
        snapshot: {
          title: 'মাটি ও আবহাওয়ার ঝলক',
          nutrientActual: 'বাস্তব',
          nutrientIdeal: 'আদর্শ',
          weatherIdeal: 'আদর্শ',
          weatherActual: 'আপনার মাঠ'
        },
        features: {
          title: 'এই পূর্বাভাসের পেছনের কারণ'
        },
        extras: {
          title: 'কৃষকের জন্য আমাদের পরবর্তী প্রস্তাব',
          offline: {
            title: 'অফলাইন মোড',
            description: 'ইন্টারনেট ছাড়াই সাম্প্রতিক ফলাফল দেখুন।'
          },
          languages: {
            title: 'স্থানীয় ভাষা',
            description: 'জনপ্রিয় ভারতীয় ভাষায় ইন্টারফেস ও অডিও নির্দেশনা দিন।'
          },
          health: {
            title: 'ফসল স্বাস্থ্য নজরদারি',
            description: 'আর্দ্রতা, বৃষ্টিপাত ও বৃদ্ধির পর্যায়ভিত্তিক দৈনিক পোকা ও রোগ সতর্কতা।'
          },
          weather: {
            title: 'আবহাওয়া সতর্ক অনুস্মারক',
            description: 'সেচ, স্প্রে বা ফসল তোলার সময়মতো সতর্কতা পাঠান।'
          }
        },
        tips: {
          phLow: 'মাটি অম্লীয়; pH ভারসাম্যের জন্য চুন বা জৈব সার দিন।',
          phHigh: 'মাটি ক্ষারীয়; pH 6.5-7 এ আনতে জৈব পদার্থ বা জিপসাম ব্যবহার করুন।',
          nitrogenLow: 'নাইট্রোজেন কম—ইউরিয়া বা সবুজ সার যোগ করুন।',
          phosphorusLow: 'ফসফরাস কম; সিঙ্গেল সুপার ফসফেট দিয়ে শিকড় শক্ত করুন।',
          potassiumLow: 'পটাশ কম; কান্ড শক্ত করতে পটাশ সার দিন।',
          humidityHigh: 'আর্দ্রতা বেশি—ছত্রাক রোগের জন্য নজর রাখুন ও হাওয়া চলাচল নিশ্চিত করুন।',
          rainfallLow: 'বৃষ্টিপাত কম—অতিরিক্ত সেচ বা মালচের ব্যবস্থা করুন।',
          fertilizerHigh: 'সারের মাত্রা বেশি; ক্ষয় রোধে ভাগ করে প্রয়োগ করুন।'
        },
        alerts: {
          predictSuccess: 'উৎপাদন পূর্বাভাস প্রস্তুত!',
          predictFailure: 'পূর্বাভাস ব্যর্থ হয়েছে। অনুগ্রহ করে ইনপুট যাচাই করুন।',
          predictError: 'পূর্বাভাসের সময় সার্ভার ত্রুটি।',
          trainSuccess: 'মডেল প্রশিক্ষণ শুরু হয়েছে।',
          trainFailure: 'প্রশিক্ষণ ব্যর্থ হয়েছে। পরে আবার চেষ্টা করুন।',
          trainError: 'প্রশিক্ষণের সময় সার্ভার ত্রুটি।',
          refreshingAI: '{{language}} ভাষায় এআই পরামর্শ হালনাগাদ হচ্ছে…',
          aiRefreshed: '{{language}} ভাষায় এআই পরামর্শ হালনাগাদ সম্পন্ন।'
        }
      }
    }
  },
  mr: {
    translation: {
      common: { more: 'अधिक', less: 'कमी' },
      header: {
        appName: 'YieldWise',
        tagline: 'स्मार्ट एआय आधारित शेती',
        optimalWindow: 'सर्वोत्कृष्ट वाढ कालावधी',
        aiRefreshed: 'एआय अंतर्दृष्टी अद्ययावत',
        themeToggle: {
          light: 'लाईट मोड निवडा',
          dark: 'डार्क मोड निवडा'
        },
        notifications: 'सूचना',
        languageLabel: 'भाषा',
        menu: {
          profilePrimary: 'प्रोफाइल',
          profileSecondary: 'शेतकरी प्रोफाइल',
          settings: 'कार्यस्थान सेटिंग्ज',
          logout: 'साइन आऊट'
        }
      },
      sidebar: {
        navigation: 'नेव्हिगेशन',
        items: {
          dashboard: 'डॅशबोर्ड',
          cropPredictor: 'पीक अंदाज',
          diseaseDetector: 'रोग शोधक',
          financialDashboard: 'आर्थिक डॅशबोर्ड',
          marketIntelligence: 'बाजार माहिती',
          mandiData: 'मंडी डेटा',
          communityForum: 'समुदाय मंच',
          chatbot: 'एआय चॅटबॉट',
          multilingualChat: 'बहुभाषिक चॅट'
        },
        tips: {
          title: 'स्मार्ट शेती टिप्स',
          subtitle: 'हवामान सूचना आणि बाजार संकेतांसोबत पुढे रहा',
          cta: 'आजचे इनसाइट्स पाहा'
        }
      },
      dashboard: {
        hero: {
          badge: 'लाईव्ह इनसाइट्स',
          title: 'रिअल-टाइम बुद्धिमत्तेने शेत व्यवस्थापन',
          subtitle: 'YieldWise पीक अंदाज, रोग निदान, किंमत माहिती आणि शेतकरी सहयोग एका प्लॅटफॉर्मवर आणतो.',
          primaryCta: 'पीक अंदाज उघडा',
          secondaryCta: 'एआय कृषी तज्ञाला विचारा'
        },
        weather: {
          title: 'शेत हवामान झलक',
          loading: 'हवामान लोड होत आहे...',
          errors: {
            fetch: 'हवामान डेटा मिळाला नाही',
            denied: 'स्थान परवानगी नाकारली. डिफॉल्ट हवामान दर्शवत आहोत.',
            unsupported: 'या ब्राउझरमध्ये भू-स्थान समर्थन नाही.'
          },
          locationFallback: 'स्थान उपलब्ध नाही',
          descriptionFallback: 'हवामान डेटा उपलब्ध नाही',
          humidity: 'आर्द्रता {{value}}%'
        },
        stats: {
          loading: 'आकडेवारी लोड होते आहे...',
          items: {
            success: {
              label: 'यशस्वी अंदाज',
              delta: 'या आठवड्यात +12%'
            },
            farms: {
              label: 'सुधारित शेत',
              delta: '+48 नवीन भागीदार'
            },
            risk: {
              label: 'जोखीम सूचना सोडविल्या',
              delta: 'प्रतिक्रिया वेळ ↓ 18%'
            }
          }
        },
        quickInsights: {
          irrigation: 'सिंचन वेळापत्रक समक्रमित',
          mandi: 'नवी मंडी किंमत बुलेटिन सज्ज'
        },
        yield: {
          title: 'उत्पन्न आढावा',
          description: 'मृदा, हवामान आणि इतिहासावर आधारित उत्पादनाचा प्रवाह.'
        },
        soil: {
          title: 'मृदा आरोग्य संकेत',
          description: 'पोषक संतुलन, किड दाब आणि हवामान धोके एकत्र पहा.',
          signals: {
            moisture: {
              title: 'मृदा आर्द्रता',
              state: 'उत्तम'
            },
            nutrients: {
              title: 'पोषक संतुलन',
              state: 'सेंद्रीय पदार्थ जोडा'
            },
            pest: {
              title: 'किड दाब',
              state: 'पुढील आठवड्यात तपासणी करा'
            },
            weather: {
              title: 'हवामान जोखीम',
              state: 'शुक्रवारी जोरदार वाऱ्याचा अंदाज'
            }
          }
        },
        readiness: {
          title: 'शेत तयारीचे संकेत',
          description: 'आयओटी प्रोब आणि सर्व्हे अपडेटवरून स्वयंचलित कृषी तपासणी.',
          loading: 'मृदा डेटा लोड होत आहे...'
        },
        modules: {
          title: 'मॉड्यूल्स शोधा',
          description: 'जिथे थांबलात तिथूनच पुढे सुरू करा; क्रिया स्वयंचलितपणे सिंक होतात.',
          cropPredictor: {
            title: 'पीक अंदाज',
            description: 'वैयक्तिकृत उत्पादन सिम्युलेशन आणि हंगामी नियोजन.'
          },
          diseaseDetector: {
            title: 'रोग शोधक',
            description: 'वनस्पतींची प्रतिमा अपलोड करा आणि एआय निदान मिळवा.'
          },
          financialDashboard: {
            title: 'आर्थिक डॅशबोर्ड',
            description: 'आरओआय कॅल्क्युलेटर, किंमत माहिती आणि बाजार अलर्ट.'
          },
          communityForum: {
            title: 'समुदाय मंच',
            description: 'जगभरातील शेतकऱ्यांचे बहुभाषिक ज्ञान वाटप.'
          },
          chatbot: {
            title: 'एआय सहाय्यक',
            description: 'संदर्भ-जाणकार एआय कृषि सहायक.'
          }
        },
        months: {
          mar: 'मार्च',
          apr: 'एप्रिल',
          may: 'मे',
          jun: 'जून',
          jul: 'जुलै',
          aug: 'ऑगस्ट',
          sep: 'सप्टेंबर'
        }
      },
      cropPredictor: {
        hero: {
          title: 'स्मार्ट पीक उत्पादन नियोजक',
          tagline: 'शेतकरी-अनुकूल • मोबाईल-प्रथम • समृद्ध अंतर्दृष्टी',
          subtitle: 'मृदा, हवामान आणि पीक तपशील भरा. आम्ही अंदाजाला प्रत्यक्ष शेतातील कृतीत बदलतो.',
          predictBtn: 'उत्पन्नाचा अंदाज लावा',
          predicting: 'अंदाज सुरू…',
          resetBtn: 'इनपुट रीसेट करा'
        },
        form: {
          sectionTitle: 'शेत आणि मृदा तपशील',
          sectionSubtitle: 'पीक, राज्य, हंगाम निवडा आणि हवामान व पोषक मूल्ये समायोजित करा.',
          fields: {
            crop: 'पीक',
            state: 'राज्य',
            season: 'हंगाम',
            year: 'हंगाम वर्ष',
            area: 'शेताचे क्षेत्रफळ',
            annualRainfall: 'वार्षिक पर्जन्य',
            fertilizer: 'खत',
            pesticide: 'कीटकनाशक',
            nitrogen: 'नायट्रोजन',
            phosphorus: 'फॉस्फरस',
            potassium: 'पोटॅशियम'
          },
          sliders: {
            title: 'द्रुत समायोजन',
            temperature: 'तापमान',
            humidity: 'आर्द्रता',
            soilPh: 'मृदा pH',
            seasonalRainfall: 'हंगामी पर्जन्य',
            helpers: {
              temperature: 'दिवसाचे सरासरी तापमान',
              humidity: 'पिक कालावधीत सापेक्ष आर्द्रता',
              soilPh: 'मृदेची आम्लता किंवा क्षारीयता',
              seasonalRainfall: 'संपूर्ण हंगामातील अपेक्षित पर्जन्य'
            }
          },
          buttons: {
            predict: 'उत्पन्नाचा अंदाज लावा',
            predicting: 'अंदाज सुरू…',
            train: 'मॉडेल प्रशिक्षण',
            training: 'प्रशिक्षण सुरू…',
            reset: 'रीसेट'
          }
        },
        results: {
          title: 'अंदाजित उत्पादन',
          areaChip: 'क्षेत्र {{value}} हेक्टर',
          confidence: 'विश्वास {{value}}%',
          range: 'संभाव्य श्रेणी: {{lower}} – {{upper}} {{unit}}',
          tipsHeading: 'झटपट शेत सूचना',
          emptyTitle: 'आपले उत्पादन येथे दिसेल',
          emptySubtitle: 'इनपुट भरा आणि “उत्पन्नाचा अंदाज लावा” क्लिक करा. निकाल व सूचना येथे दिसतील.',
          error: 'अंदाज अयशस्वी. कृपया इनपुट तपासा.',
          aiHeading: 'Gemini उत्पन्न शिफारसी',
          aiUnavailable: 'शिफारसी सध्या उपलब्ध नाहीत.',
          aiLanguageChip: 'एआय भाषा: {{lang}}',
          aiRefreshingChip: 'एआय सूचना अद्ययावत होत आहेत…'
        },
        snapshot: {
          title: 'मृदा व हवामान झलक',
          nutrientActual: 'प्रत्यक्ष',
          nutrientIdeal: 'आदर्श',
          weatherIdeal: 'आदर्श',
          weatherActual: 'आपले शेत'
        },
        features: {
          title: 'या अंदाजामागील घटक'
        },
        extras: {
          title: 'शेतकऱ्यांसाठी पुढील सोयी',
          offline: {
            title: 'ऑफलाइन मोड',
            description: 'नेटवर्क नसतानाही ताजे परिणाम बघा.'
          },
          languages: {
            title: 'स्थानिक भाषा',
            description: 'लोकप्रिय भारतीय भाषांमध्ये इंटरफेस आणि ऑडिओ मार्गदर्शन द्या.'
          },
          health: {
            title: 'पीक आरोग्य निरीक्षण',
            description: 'आर्द्रता, पर्जन्य आणि वाढीच्या टप्प्यावर आधारित दररोजच्या सूचना.'
          },
          weather: {
            title: 'हवामान-जाणिवा स्मरणपत्रे',
            description: 'सिंचन, फवारणी किंवा कापणीसाठी वेळेवर अलर्ट पाठवा.'
          }
        },
        tips: {
          phLow: 'मृदा आम्लीय आहे; pH संतुलनासाठी चुना किंवा सेंद्रीय खते जोडा.',
          phHigh: 'मृदा क्षारीय आहे; pH 6.5-7 जवळ आणण्यासाठी सेंद्रीय पदार्थ किंवा जिप्सम जोडा.',
          nitrogenLow: 'नायट्रोजन कमी आहे—युरिया किंवा हिरवळी खताचा वापर करा.',
          phosphorusLow: 'फॉस्फरस कमी आहे; मूळ मजबूत करण्यासाठी सिंगल सुपर फॉस्फेट द्या.',
          potassiumLow: 'पोटॅशियम कमी आहे; खोड मजबूत करण्यासाठी पोटॅश खत द्या.',
          humidityHigh: 'उच्च आर्द्रता—बुरशीजन्य रोगाची तपासणी करा.',
          rainfallLow: 'कमी पर्जन्य—अतिरिक्त सिंचन किंवा मल्चिंग करा.',
          fertilizerHigh: 'खताचे प्रमाण जास्त—नुकसान कमी करण्यासाठी विभाजित करा.'
        },
        alerts: {
          predictSuccess: 'उत्पन्नाचा अंदाज तयार आहे!',
          predictFailure: 'अंदाज अयशस्वी. कृपया इनपुट तपासा.',
          predictError: 'अंदाजादरम्यान सर्व्हर त्रुटी.',
          trainSuccess: 'मॉडेल प्रशिक्षण सुरू झाले.',
          trainFailure: 'प्रशिक्षण अयशस्वी. नंतर पुन्हा प्रयत्न करा.',
          trainError: 'प्रशिक्षणादरम्यान सर्व्हर त्रुटी.',
          refreshingAI: '{{language}} मध्ये एआय शिफारसी अद्ययावत होत आहेत…',
          aiRefreshed: '{{language}} मध्ये एआय शिफारसी अद्ययावत झाल्या.'
        }
      }
    }
  },
  ta: {
    translation: {
      common: { more: 'மேலும்', less: 'குறைவாக' },
      header: {
        appName: 'YieldWise',
        tagline: 'செயல்திறன் மிக்க ஏஐ விவசாயம்',
        optimalWindow: 'சிறந்த வளர்ப்பு காலம்',
        aiRefreshed: 'ஏஐ கருத்துகள் புதுப்பித்தன',
        themeToggle: {
          light: 'லைட் மோடு மாற்று',
          dark: 'டார்க் மோடு மாற்று'
        },
        notifications: 'அறிவிப்புகள்',
        languageLabel: 'மொழி',
        menu: {
          profilePrimary: 'சுயவிவரம்',
          profileSecondary: 'விவசாயி சுயவிவரம்',
          settings: 'பணிமனை அமைப்புகள்',
          logout: 'வெளியேறு'
        }
      },
      sidebar: {
        navigation: 'வழிச்செலுத்தல்',
        items: {
          dashboard: 'டாஷ்போர்டு',
          cropPredictor: 'பயிர் கணிப்பு',
          diseaseDetector: 'நோய் கண்டறிதல்',
          financialDashboard: 'நிதி டாஷ்போர்டு',
          marketIntelligence: 'சந்தை தகவல்',
          mandiData: 'மண்டி தரவு',
          communityForum: 'சமூக அரங்கு',
          chatbot: 'ஏஐ அரட்டை',
          multilingualChat: 'பலமொழி அரட்டை'
        },
        tips: {
          title: 'ச்மார்ட் விவசாய குறிப்புகள்',
          subtitle: 'வானிலை எச்சரிக்கை மற்றும் சந்தை சைகையில் முன்னிலை பெறுங்கள்',
          cta: 'இன்றைய கருத்துகளைப் பாருங்கள்'
        }
      },
      dashboard: {
        hero: {
          badge: 'நேரடி தகவல்',
          title: 'உண்மைக்கால நுண்ணறிவால் வயல்கள் வழிநடத்தல்',
          subtitle: 'YieldWise பயிர் கணிப்பு, நோய் கண்டறிதல், விலைத் தகவல், விவசாயிகள் ஒத்துழைப்பு ஆகியவற்றை ஒரே தளத்தில் தருகிறது.',
          primaryCta: 'பயிர் கணிப்பைத் திறக்க',
          secondaryCta: 'ஏஐ வேளாண் நிபுணரை கேளுங்கள்'
        },
        weather: {
          title: 'வயல் வானிலை சுருக்கம்',
          loading: 'வானிலை ஏற்றப்படுகிறது...',
          errors: {
            fetch: 'வானிலை தரவை பெற முடியவில்லை',
            denied: 'இருப்பிட அனுமதி மறுக்கப்பட்டது. இயல்புநிலை வானிலை காட்டப்படுகிறது.',
            unsupported: 'இந்த உலாவி நிலவரத்தை ஆதரிக்காது.'
          },
          locationFallback: 'இடம் கிடைக்கவில்லை',
          descriptionFallback: 'வானிலைத் தகவல் கிடைக்கவில்லை',
          humidity: 'ஈரப்பதம் {{value}}%'
        },
        stats: {
          loading: 'புள்ளிவிபரங்கள் ஏற்றப்படுகிறது...',
          items: {
            success: {
              label: 'வெற்றிகரமான கணிப்புகள்',
              delta: 'இந்த வாரம் +12%'
            },
            farms: {
              label: 'மேம்படுத்தப்பட்ட பண்ணைகள்',
              delta: '+48 புதிய கூட்டாளர்கள்'
            },
            risk: {
              label: 'அபாய எச்சரிக்கைகள் தீர்வடைந்தது',
              delta: 'பதில் நேரம் ↓ 18%'
            }
          }
        },
        quickInsights: {
          irrigation: 'பாசன அட்டவணை ஒத்திசைக்கப்பட்டது',
          mandi: 'புதிய மண்டி விலை அறிவிப்பு தயார்'
        },
        yield: {
          title: 'உற்பத்தி முன்னோக்கிய பார்வை',
          description: 'மண், வானிலை மற்றும் வரலாற்று தரவுகளை இணைத்து கணிக்கப்பட்ட உற்பத்தி.'
        },
        soil: {
          title: 'மண் ஆரோக்கிய சுட்டிகள்',
          description: 'உட்டச்சத்து, பூச்சி அழுத்தம், வானிலை அபாயங்களை ஒரே பார்வையில் காணலாம்.',
          signals: {
            moisture: {
              title: 'மண் ஈரப்பதம்',
              state: 'சிறந்தது'
            },
            nutrients: {
              title: 'உட்டச்சத்து சமநிலை',
              state: 'இயற்கை பொருட்கள் சேர்க்கவும்'
            },
            pest: {
              title: 'பூச்சி அழுத்தம்',
              state: 'அடுத்த வாரம் கண்காணிக்கவும்'
            },
            weather: {
              title: 'வானிலை அபாயம்',
              state: 'வெள்ளிக்கிழமை பலத்த காற்று எச்சரிக்கை'
            }
          }
        },
        readiness: {
          title: 'வயல் தயார்நிலை சுட்டிகள்',
          description: 'IoT கருவிகள் மற்றும் கண்காணிப்பு புதுப்பிப்புகளில் இருந்து தானியங்கி வேளாண் கண்காணிப்புகள்.',
          loading: 'மண் தரவு ஏற்றப்படுகிறது...'
        },
        modules: {
          title: 'மொட்யூல்களை ஆய்வு செய்யுங்கள்',
          description: 'நீங்கள் நிறுத்திய இடத்திலிருந்து தொடருங்கள்; செயல்கள் தானாக ஒத்திசைகின்றன.',
          cropPredictor: {
            title: 'பயிர் கணிப்பு',
            description: 'தனிப்பயன் உற்பத்தி சிமுலேஷன்கள் மற்றும் பருவத் திட்டமிடல்.'
          },
          diseaseDetector: {
            title: 'நோய் கண்டறிதல்',
            description: 'தாவரப் படங்களை பதிவேற்றி ஏஐ அடிப்படையிலான கண்டறிதல் பெறுங்கள்.'
          },
          financialDashboard: {
            title: 'நிதி டாஷ்போர்டு',
            description: 'இலாப கணக்கீட்டுகள், விலை தகவல் மற்றும் சந்தை அச்சுறுத்தல்கள்.'
          },
          communityForum: {
            title: 'சமூக அரங்கு',
            description: 'உலகம் முழுதும் விவசாயிகளிடமிருந்து பலமொழி அறிவு பகிர்வு.'
          },
          chatbot: {
            title: 'ஏஐ உதவியாளர்',
            description: 'சூழல் புரியும் ஏஐ வேளாண் உதவியாளர்.'
          }
        },
        months: {
          mar: 'மார்ச்',
          apr: 'ஏப்ரல்',
          may: 'மே',
          jun: 'ஜூன்',
          jul: 'ஜூலை',
          aug: 'ஆகஸ்ட்',
          sep: 'செப்டம்பர்'
        }
      },
      cropPredictor: {
        hero: {
          title: 'ச்மார்ட் பயிர் உற்பத்தி திட்டமிடுபவர்',
          tagline: 'விவசாயிக்கு ஏற்றது • மொபைல் முதன்மை • ஆழ்ந்த கருத்துகள்',
          subtitle: 'மண், வானிலை, பயிர் விவரங்களை உள்ளிடுங்கள். கணிப்பை நேரடியாக பண்ணை நடவடிக்கைகளாக மாற்றுகிறோம்.',
          predictBtn: 'உற்பத்தியை கணிக்க',
          predicting: 'கணிக்கப்பட்டுக் கொண்டிருக்கிறது…',
          resetBtn: 'உள்ளீடுகளை மீட்டமை'
        },
        form: {
          sectionTitle: 'வயல் மற்றும் மண் விவரங்கள்',
          sectionSubtitle: 'பயிர், மாநிலம், காலம் தெரிவுசெய்து வானிலை மற்றும் உட்டச்சத்து மதிப்புகளை சரிசெய்க.',
          fields: {
            crop: 'பயிர்',
            state: 'மாநிலம்',
            season: 'காலம்',
            year: 'கால வருடம்',
            area: 'பண்ணை பரப்பு',
            annualRainfall: 'வருடாந்திர மழை',
            fertilizer: 'உரம்',
            pesticide: 'பூச்சிமருந்து',
            nitrogen: 'நைட்ரஜன்',
            phosphorus: 'பாஸ்பரஸ்',
            potassium: 'பொட்டாசியம்'
          },
          sliders: {
            title: 'விரைவு திருத்தங்கள்',
            temperature: 'வெப்பநிலை',
            humidity: 'ஈரப்பதம்',
            soilPh: 'மண் pH',
            seasonalRainfall: 'முற்பகால மழை',
            helpers: {
              temperature: 'ஒரு நாளின் சராசரி வெப்பநிலை',
              humidity: 'பயிர் காலத்தில் உள்ள ஈரப்பதம்',
              soilPh: 'மண் அமிலம் அல்லது க்ஷாரம் நிலை',
              seasonalRainfall: 'முழு காலத்தில் எதிர்பார்க்கும் மழை'
            }
          },
          buttons: {
            predict: 'உற்பத்தியை கணிக்க',
            predicting: 'கணிக்கப்பட்டுக் கொண்டிருக்கிறது…',
            train: 'மாதிரியை பயிற்று',
            training: 'பயிற்சி நடைபெறுகிறது…',
            reset: 'மீட்டமை'
          }
        },
        results: {
          title: 'கணிக்கப்பட்ட உற்பத்தி',
          areaChip: 'பரப்பு {{value}} ஹெக்டேர்',
          confidence: 'நம்பிக்கை {{value}}%',
          range: 'சாத்தியமான வரம்பு: {{lower}} – {{upper}} {{unit}}',
          tipsHeading: 'வயல் விரைவு குறிப்புகள்',
          emptyTitle: 'உங்கள் உற்பத்தி இங்கே தோன்றும்',
          emptySubtitle: 'உள்ளீடுகளை நிரப்பி “உற்பத்தியை கணிக்க” சொடுக்கவும். முடிவு மற்றும் குறிப்புகள் இங்கே தோன்றும்.',
          error: 'கணிப்பு தோல்வியடைந்தது. தயவுசெய்து உள்ளீடுகளைச் சரிபார்க்கவும்.',
          aiHeading: 'Gemini உற்பத்தி பரிந்துரைகள்',
          aiUnavailable: 'பரிந்துரைகள் தற்போது கிடைக்கவில்லை.',
          aiLanguageChip: 'ஏஐ மொழி: {{lang}}',
          aiRefreshingChip: 'ஏஐ பரிந்துரைகள் புதுப்பிக்கப்படுகிறது…'
        },
        snapshot: {
          title: 'மண் & வானிலை சுருக்கம்',
          nutrientActual: 'நிகழ்',
          nutrientIdeal: 'சிறந்த',
          weatherIdeal: 'சிறந்த',
          weatherActual: 'உங்கள் வயல்'
        },
        features: {
          title: 'இந்த கணிப்புக்குக் காரணமான அம்சங்கள்'
        },
        extras: {
          title: 'விவசாயிகளுக்கான அடுத்த முன்னுரிமைகள்',
          offline: {
            title: 'ஆஃப்லைன் நிலை',
            description: 'இணையம் இல்லாதபோதும் சமீபத்திய முடிவுகளை பார்க்கலாம்.'
          },
          languages: {
            title: 'உள்ளூர் மொழிகள்',
            description: 'பிரபலமான இந்திய மொழிகளில் இடைமுகம் மற்றும் ஒலி வழிகாட்டுதலை வழங்குங்கள்.'
          },
          health: {
            title: 'பயிர் ஆரோக்கிய கண்காணிப்பு',
            description: 'ஈரப்பதம், மழை, வளர்ச்சி நிலை அடிப்படையில் தினசரி எச்சரிக்கை.'
          },
          weather: {
            title: 'வானிலை நினைவூட்டல்கள்',
            description: 'நீர்ப்பாசனம், தெளிப்பு அல்லது அறுவடை செய்ய சரியான நேரத்தில் அறிவிக்கவும்.'
          }
        },
        tips: {
          phLow: 'மண் அமிலம் அதிகம்; pH ஐ சமநிலைக்கு கொண்டு வர சுண்ணாம்பு அல்லது இயற்கை உரம் சேர்க்கவும்.',
          phHigh: 'மண் க்ஷாரமாக உள்ளது; pH ஐ 6.5-7 க்கு கொண்டு வர இயற்கை பொருள் அல்லது ஜிப்சம் பயன்படுத்துங்கள்.',
          nitrogenLow: 'நைட்ரஜன் குறைவு—யூரியா அல்லது பச்சைத்தீவனம் சேர்க்கவும்.',
          phosphorusLow: 'பாஸ்பரஸ் குறைவு; வேர் வளர்ச்சிக்கு சிங்கிள் சூப்பர் பாஸ்பேட் உதவும்.',
          potassiumLow: 'பொட்டாசியம் குறைவு; தண்டு வலுப்படுத்த பொட்டாஷ் சேர்க்கவும்.',
          humidityHigh: 'உயர் ஈரப்பதம்—பூஞ்சை நோய்களை கண்காணிக்கவும்.',
          rainfallLow: 'மழை குறைவு—கூடுதல் பாசனம் அல்லது மல்ச் திட்டமிடவும்.',
          fertilizerHigh: 'உர அளவு அதிகம்; இழப்பு தவிர்க்க பிரித்து பயன்படுத்தவும்.'
        },
        alerts: {
          predictSuccess: 'உற்பத்தி கணிப்பு தயார்!',
          predictFailure: 'கணிப்பு தோல்வியடைந்தது. தயவுசெய்து உள்ளீடுகளைச் சரிபார்க்கவும்.',
          predictError: 'கணிப்பு செய்யும் போது சர்வர் பிழை.',
          trainSuccess: 'மாதிரி பயிற்சி தொடங்கியது.',
          trainFailure: 'பயிற்சி தோல்வி. பின்னர் முயற்சிக்கவும்.',
          trainError: 'பயிற்சியின் போது சர்வர் பிழை.',
          refreshingAI: '{{language}} இல் ஏஐ பரிந்துரைகள் புதுப்பிக்கப்படுகிறது…',
          aiRefreshed: '{{language}} இல் ஏஐ பரிந்துரைகள் புதுப்பிக்கப்பட்டது.'
        }
      }
    }
  },
  te: {
    translation: {
      common: { more: 'మరింత', less: 'తక్కువ' },
      header: {
        appName: 'YieldWise',
        tagline: 'స్మార్ట్ ఏఐ ఆధారిత వ్యవసాయం',
        optimalWindow: 'అత్యుత్తమ పెరుగుదల సమయం',
        aiRefreshed: 'ఏఐ అంతర్దృష్టులు నవీకరించబడ్డాయి',
        themeToggle: {
          light: 'లైట్ మోడ్‌కి మారండి',
          dark: 'డార్క్ మోడ్‌కి మారండి'
        },
        notifications: 'అధిసూచనలు',
        languageLabel: 'భాష',
        menu: {
          profilePrimary: 'ప్రొఫైల్',
          profileSecondary: 'రైతు ప్రొఫైల్',
          settings: 'వర్క్‌స్పేస్ అమరికలు',
          logout: 'సైన్ అవుట్'
        }
      },
      sidebar: {
        navigation: 'నావిగేషన్',
        items: {
          dashboard: 'డాష్‌బోర్డ్',
          cropPredictor: 'పంట అంచనా',
          diseaseDetector: 'వ్యాధి గుర్తింపు',
          financialDashboard: 'ఆర్థిక డాష్‌బోర్డ్',
          marketIntelligence: 'మార్కెట్ సమాచారం',
          mandiData: 'మండి డేటా',
          communityForum: 'సమాజ ఫోరం',
          chatbot: 'ఏఐ చాట్‌బాట్',
          multilingualChat: 'బహుభాషా చాట్'
        },
        tips: {
          title: 'స్మార్ట్ వ్యవసాయ సూచనలు',
          subtitle: 'వాతావరణ హెచ్చరికలు మరియు మార్కెట్ సంకేతాలతో ముందుండండి',
          cta: 'ఈరోజు అంతర్దృష్టులను చూడండి'
        }
      },
      dashboard: {
        hero: {
          badge: 'లైవ్ అంతర్దృష్టులు',
          title: 'రియల్-టైమ్ బుద్ధితో వ్యవసాయం నడిపించడం',
          subtitle: 'YieldWise పంట అంచనా, వ్యాధి నిర్ధారణ, ధర సమాచారం మరియు రైతు సహకారాన్ని ఒకే ప్లాట్‌ఫార్మ్‌లో ఇస్తుంది.',
          primaryCta: 'పంట అంచనా తెరవండి',
          secondaryCta: 'ఏఐ వ్యవసాయ నిపుణుడిని అడగండి'
        },
        weather: {
          title: 'ఫీల్డ్ వాతావరణ దృశ్యం',
          loading: 'వాతావరణం లోడ్ అవుతుంది...',
          errors: {
            fetch: 'వాతావరణ డాటాను పొందలేకపోయాము',
            denied: 'స్థాన అనుమతి నిరాకరించబడింది. డిఫాల్ట్ వాతావరణాన్ని చూపిస్తున్నాము.',
            unsupported: 'ఈ బ్రౌజర్‌లో స్థలకల్పనకు మద్దతు లేదు.'
          },
          locationFallback: 'స్థానం అందుబాటులో లేదు',
          descriptionFallback: 'వాతావరణ డేటా లేదు',
          humidity: 'ఆర్ద్రత {{value}}%'
        },
        stats: {
          loading: 'గణాంకాలు లోడ్ అవుతున్నాయి...',
          items: {
            success: {
              label: 'విజయవంతమైన అంచనాలు',
              delta: 'ఈ వారం +12%'
            },
            farms: {
              label: 'మెరుగైన ఫామ్స్',
              delta: '+48 కొత్త భాగస్వాములు'
            },
            risk: {
              label: 'ప్రమాద హెచ్చరికలు పరిష్కరించబడ్డాయి',
              delta: 'స్పందన సమయం ↓ 18%'
            }
          }
        },
        quickInsights: {
          irrigation: 'పారుదల షెడ్యూల్ సింక్ అయ్యింది',
          mandi: 'కొత్త మంచిది ధర బులెటిన్ సిద్ధం'
        },
        yield: {
          title: 'ఉత్పత్తి దిశ',
          description: 'మట్టి, వాతావరణం, చరిత్ర ఆధారంగా పంట ఉత్పత్తి అంచనా.'
        },
        soil: {
          title: 'మట్టి ఆరోగ్య సంకేతాలు',
          description: 'పోషకాలు, కీటక ఒత్తిడి మరియు వాతావరణ ప్రమాదాలను ఒకే దృశ్యంలో చూడండి.',
          signals: {
            moisture: {
              title: 'మట్టి ఆర్ద్రత',
              state: 'అత్యుత్తమం'
            },
            nutrients: {
              title: 'పోషక సమతుల్యం',
              state: 'సేంద్రియ పదార్థాలు జోడించండి'
            },
            pest: {
              title: 'పురుగు ఒత్తిడి',
              state: 'తదుపరి వారంలో పర్యవేక్షించండి'
            },
            weather: {
              title: 'వాతావరణ ప్రమాదం',
              state: 'శుక్రవారం బలమైన గాలుల హెచ్చరిక'
            }
          }
        },
        readiness: {
          title: 'ఫార్మ్ సిద్ధత సంకేతాలు',
          description: 'IoT ప్రోబ్‌లు మరియు స్కౌటింగ్ నవీకరణల నుండి ఆటోమేటెడ్ వ్యవసాయ పరిశీలనలు.',
          loading: 'మట్టి డేటా లోడ్ అవుతోంది...'
        },
        modules: {
          title: 'మాడ్యూల్స్ అన్వేషించండి',
          description: 'మీరు ఆపిన చోట నుండి కొనసాగండి; చర్యలు ఆటోమేటిక్‌గా సింక్ అవుతాయి.',
          cropPredictor: {
            title: 'పంట అంచనా',
            description: 'వ్యక్తిగత ఉత్పత్తి అనుకరణలు మరియు సీజన్ ప్రణాళిక.'
          },
          diseaseDetector: {
            title: 'వ్యాధి గుర్తింపు',
            description: 'మొక్కల చిత్రాలు అప్లోడ్ చేసి ఏఐ ఆధారిత నిర్ధారణ పొందండి.'
          },
          financialDashboard: {
            title: 'ఆర్థిక డాష్‌బోర్డ్',
            description: 'ఆర్ఓఐ లెక్కింపులు, ధర సమాచారము మరియు మార్కెట్ హెచ్చరికలు.'
          },
          communityForum: {
            title: 'సమాజ ఫోరం',
            description: 'ప్రపంచవ్యాప్త రైతుల నుండి బహుభాషా జ్ఞాన భాగస్వామ్యం.'
          },
          chatbot: {
            title: 'ఏఐ సహాయకుడు',
            description: 'సందర్భాన్ని అర్థం చేసుకునే ఏఐ వ్యవసాయ సహాయకుడు.'
          }
        },
        months: {
          mar: 'మార్చి',
          apr: 'ఏప్రిల్',
          may: 'మే',
          jun: 'జూన్',
          jul: 'జూలై',
          aug: 'ఆగస్ట్',
          sep: 'సెప్టెంబర్'
        }
      },
      cropPredictor: {
        hero: {
          title: 'స్మార్ట్ పంట ఉత్పత్తి ప్రణాళిక',
          tagline: 'రైతు స్నేహపూర్వక • మొబైల్-మొదటి • లోతైన అంతర్దృష్టులు',
          subtitle: 'మట్టి, వాతావరణం, పంట వివరాలు ఇవ్వండి. మేము అంచనాను ఫీల్డ్‌లో చేయగల చర్యలుగా మార్చుతాము.',
          predictBtn: 'ఉత్పత్తి అంచనా వేయండి',
          predicting: 'అంచనా జరుగుతోంది…',
          resetBtn: 'ఇన్‌పుట్ రీసెట్ చేయండి'
        },
        form: {
          sectionTitle: 'ఫీల్డ్ మరియు మట్టి వివరాలు',
          sectionSubtitle: 'పంట, రాష్ట్రం, సీజన్ ఎంచుకుని వాతావరణం మరియు పోషకాల విలువలను సవరించండి.',
          fields: {
            crop: 'పంట',
            state: 'రాష్ట్రం',
            season: 'సీజన్',
            year: 'సీజన్ సంవత్సరం',
            area: 'ఫీల్డ్ విస్తీర్ణం',
            annualRainfall: 'వార్షిక వర్షపాతం',
            fertilizer: 'ఎరువు',
            pesticide: 'పురుగుమందు',
            nitrogen: 'నైట్రోజన్',
            phosphorus: 'ఫాస్పరస్',
            potassium: 'పోటాషియం'
          },
          sliders: {
            title: 'వేగవంతమైన సవరింపులు',
            temperature: 'ఉష్ణోగ్రత',
            humidity: 'ఆర్ద్రత',
            soilPh: 'మట్టి pH',
            seasonalRainfall: 'సీజనల్ వర్షపాతం',
            helpers: {
              temperature: 'దినసరి సగటు ఉష్ణోగ్రత',
              humidity: 'పెంపకం కాలంలో ఉన్న ఆర్ద్రత',
              soilPh: 'మట్టి ఆమ్లం లేదా క్షార స్థాయి',
              seasonalRainfall: 'మొత్తం సీజన్‌లో ఆశించే వర్షం'
            }
          },
          buttons: {
            predict: 'ఉత్పత్తి అంచనా',
            predicting: 'అంచనా జరుగుతోంది…',
            train: 'మోడల్ శిక్షణ',
            training: 'శిక్షణ జరుగుతోంది…',
            reset: 'రీసెట్'
          }
        },
        results: {
          title: 'అంచనా ఉత్పత్తి',
          areaChip: 'విస్తీర్ణం {{value}} హెక్టార్లు',
          confidence: 'నమ్మకం {{value}}%',
          range: 'సంభావ్య పరిధి: {{lower}} – {{upper}} {{unit}}',
          tipsHeading: 'ఫీల్డ్ త్వరిత సూచనలు',
          emptyTitle: 'మీ ఉత్పత్తి ఇక్కడ చూపబడుతుంది',
          emptySubtitle: 'ఇన్‌పుట్ పూర్తి చేసి “ఉత్పత్తి అంచనా” పై నొక్కండి. ఫలితం మరియు సూచనలు ఇక్కడ కనిపిస్తాయి.',
          error: 'అంచనా విఫలమైంది. దయచేసి ఇన్‌పుట్‌లను తనిఖీ చేయండి.',
          aiHeading: 'Gemini ఉత్పత్తి సిఫారసులు',
          aiUnavailable: 'సిఫారసులు ప్రస్తుతం అందుబాటులో లేవు.',
          aiLanguageChip: 'ఏఐ భాష: {{lang}}',
          aiRefreshingChip: 'ఏఐ సిఫారసులు నవీకరించబడుతున్నాయి…'
        },
        snapshot: {
          title: 'మట్టి & వాతావరణ స్నాప్షాట్',
          nutrientActual: 'ఆచరణలో',
          nutrientIdeal: 'ఆదర్శ',
          weatherIdeal: 'ఆదర్శ',
          weatherActual: 'మీ ఫీల్డ్'
        },
        features: {
          title: 'ఈ అంచనాకు ప్రభావం చూపిన అంశాలు'
        },
        extras: {
          title: 'రైతులకు మేము తదుపరి సూచించే అంశాలు',
          offline: {
            title: 'ఆఫ్‌లైన్ మోడ్',
            description: 'నెట్‌వర్క్ లేకపోయినా తాజా ఫలితాలను చూడండి.'
          },
          languages: {
            title: 'స్థానిక భాషలు',
            description: 'ప్రసిద్ధ భారతీయ భాషల్లో ఇంటర్‌ఫేస్ మరియు ఆడియో మార్గదర్శకత ఇవ్వండి.'
          },
          health: {
            title: 'పంట ఆరోగ్య పహారా',
            description: 'ఆర్ద్రత, వర్షపాతం, పెరుగుదల దశ ఆధారంగా రోజువారీ హెచ్చరికలు.'
          },
          weather: {
            title: 'వాతావరణ గుర్తింపులు',
            description: 'పారుదల, స్ప్రే లేదా పంట కోతకు సరైన సమయాన్ని సూచించే అలర్ట్లు.'
          }
        },
        tips: {
          phLow: 'మట్టి ఆమ్లంగా ఉంది; pH సమతుల్యం చేయడానికి లైమ్ లేదా సేంద్రియ ఎరువులు జోడించండి.',
          phHigh: 'మట్టి క్షారంగా ఉంది; pH ని 6.5-7 కు తీసుకురావడానికి సేంద్రియ పదార్థం లేదా జిప్సం వాడండి.',
          nitrogenLow: 'నైట్రోజన్ తక్కువగా ఉంది—యూరియా లేదా హరితపెంపకం ఉపయోగించండి.',
          phosphorusLow: 'ఫాస్పరస్ తక్కువ; వేరుల బలానికి సింగల్ సూపర్ ఫాస్ఫేట్ ఉపయోగించండి.',
          potassiumLow: 'పోటాషియం తక్కువ; కాండాలను బలపరచడానికి పోటాష్ చేర్చండి.',
          humidityHigh: 'ఆర్ద్రత ఎక్కువ—ఫంగల్ రోగాలపై కన్నేసి ఉంచండి.',
          rainfallLow: 'వర్షపాతం తక్కువ—అదనపు పారుదల లేదా మల్చింగ్ ప్లాన్ చేయండి.',
          fertilizerHigh: 'ఎరువు మోతాదు ఎక్కువ; నష్టాన్ని తగ్గించడానికి విడిగా ప్రయోగించండి.'
        },
        alerts: {
          predictSuccess: 'ఉత్పత్తి అంచనా సిద్ధం!',
          predictFailure: 'అంచనా విఫలమైంది. దయచేసి ఇన్‌పుట్‌లను తనిఖీ చేయండి.',
          predictError: 'అంచనా సమయంలో సర్వర్ లోపం.',
          trainSuccess: 'మోడల్ శిక్షణ ప్రారంభమైంది.',
          trainFailure: 'శిక్షణ విఫలమైంది. తరువాత మళ్లీ ప్రయత్నించండి.',
          trainError: 'శిక్షణ సమయంలో సర్వర్ లోపం.',
          refreshingAI: '{{language}} లో ఏఐ సిఫారసులు నవీకరించబడుతున్నాయి…',
          aiRefreshed: '{{language}} లో ఏఐ సిఫారసులు నవీకరించబడ్డాయి.'
        }
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

if (typeof window !== 'undefined') {
  i18n.on('languageChanged', (lng) => {
    localStorage.setItem(STORAGE_KEY, lng);
  });
}

export default i18n;
