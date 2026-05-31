const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

const getGenAI = () => {
  if (!genAI && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here') {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const analyzeDeviceHistory = async (deviceInfo, repairHistory) => {
  const ai = getGenAI();
  if (!ai) {
    return {
      analysis: 'Gemini API не налаштовано. Додайте GEMINI_API_KEY у .env файл.',
      recommendations: [],
      predictedFailures: [],
    };
  }

  const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Ти — експерт з ремонту електроніки. Проаналізуй історію ремонтів пристрою та дай прогноз можливих поломок.

ПРИСТРІЙ:
- Тип: ${deviceInfo.deviceType}
- Бренд: ${deviceInfo.brand}
- Модель: ${deviceInfo.model}
- Дата покупки: ${deviceInfo.purchaseDate || 'невідомо'}
- Вік пристрою: ${deviceInfo.ageMonths} місяців

ІСТОРІЯ РЕМОНТІВ (${repairHistory.length} записів):
${repairHistory.map((r, i) => `${i + 1}. Дата: ${r.date}, Проблема: ${r.description}, Діагноз: ${r.diagnosis || 'N/A'}, Тип ремонту: ${r.repairTypes || 'N/A'}, Вартість: ${r.cost} грн`).join('\n')}

Дай відповідь СТРОГО у форматі JSON (без markdown-обгортки):
{
  "analysis": "Загальний аналіз стану пристрою (2-3 речення українською)",
  "predictedFailures": [
    {
      "type": "Тип можливої поломки",
      "probability": 0.75,
      "timeframe": "протягом 3 місяців",
      "reason": "Чому це ймовірно"
    }
  ],
  "recommendations": [
    "Рекомендація 1",
    "Рекомендація 2"
  ],
  "riskLevel": "low|medium|high"
}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (error) {
    console.error('Gemini API error:', error.message);
    return {
      analysis: 'Не вдалося отримати аналіз від Gemini AI.',
      recommendations: ['Зверніться до майстра для діагностики'],
      predictedFailures: [],
      riskLevel: 'medium',
    };
  }
};

module.exports = { analyzeDeviceHistory };
