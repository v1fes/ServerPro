import { Card, Tag, Typography, Divider, Empty } from 'antd';

const { Paragraph, Text } = Typography;

const riskColor = (riskLevel) => {
    if (riskLevel === 'high') return 'red';
    if (riskLevel === 'medium') return 'orange';
    return 'green';
};

const PredictionResults = ({ prediction }) => {
    if (!prediction) return null;

    const mlPrediction = prediction.mlResult?.prediction;
    const geminiAnalysis = prediction.geminiAnalysis;

    return (
        <div style={{ marginTop: 16 }}>
            <Divider orientation="left">ML-прогноз локальної моделі</Divider>

            {mlPrediction ? (
                <Card size="small" style={{ marginBottom: 16 }}>
                    <Paragraph>
                        <Text strong>Ймовірність поломки: </Text>
                        {Math.round((mlPrediction.failureProbability || 0) * 100)}%
                    </Paragraph>

                    <Paragraph>
                        <Text strong>Рівень ризику: </Text>
                        <Tag color={riskColor(mlPrediction.riskLevel)}>
                            {mlPrediction.riskLevel}
                        </Tag>
                    </Paragraph>

                    <Paragraph>
                        <Text strong>Прогнозований тип поломки: </Text>
                        {mlPrediction.predictedFailureLabel || mlPrediction.predictedFailureType || '-'}
                    </Paragraph>

                    <Paragraph>
                        <Text strong>Чи очікується поломка найближчим часом: </Text>
                        {mlPrediction.willFailSoon ? 'Так' : 'Ні'}
                    </Paragraph>

                    {mlPrediction.topFailures?.length > 0 && (
                        <>
                            <Paragraph strong>Топ можливих поломок:</Paragraph>
                            {mlPrediction.topFailures.map((failure, index) => (
                                <Card key={`${failure.type}-${index}`} size="small" style={{ marginBottom: 8 }}>
                                    <Text strong>{failure.label || failure.type}</Text>
                                    <br />
                                    <Text type="secondary">
                                        Ймовірність: {Math.round((failure.probability || 0) * 100)}%
                                    </Text>
                                </Card>
                            ))}
                        </>
                    )}

                    {mlPrediction.recommendations?.length > 0 && (
                        <>
                            <Paragraph strong style={{ marginTop: 12 }}>Рекомендації ML:</Paragraph>
                            <ul>
                                {mlPrediction.recommendations.map((recommendation, index) => (
                                    <li key={index}>{recommendation}</li>
                                ))}
                            </ul>
                        </>
                    )}
                </Card>
            ) : (
                <Empty
                    description="ML-прогноз недоступний. Перевірте, чи запущений ML-service на localhost:5001"
                    style={{ marginBottom: 16 }}
                />
            )}

            <Divider orientation="left">Gemini AI аналіз</Divider>

            {geminiAnalysis ? (
                <Card size="small">
                    <Paragraph>{geminiAnalysis.analysis}</Paragraph>

                    {geminiAnalysis.riskLevel && (
                        <Tag color={riskColor(geminiAnalysis.riskLevel)}>
                            Рівень ризику: {geminiAnalysis.riskLevel}
                        </Tag>
                    )}

                    {geminiAnalysis.recommendations?.length > 0 && (
                        <>
                            <Paragraph strong style={{ marginTop: 12 }}>Рекомендації Gemini:</Paragraph>
                            <ul>
                                {geminiAnalysis.recommendations.map((recommendation, index) => (
                                    <li key={index}>{recommendation}</li>
                                ))}
                            </ul>
                        </>
                    )}

                    {geminiAnalysis.predictedFailures?.length > 0 && (
                        <>
                            <Paragraph strong style={{ marginTop: 12 }}>Прогнозовані поломки Gemini:</Paragraph>
                            {geminiAnalysis.predictedFailures.map((failure, index) => (
                                <Card key={index} size="small" style={{ marginBottom: 8 }}>
                                    <Text strong>{failure.type}</Text>
                                    {' — ймовірність: '}
                                    {Math.round((failure.probability || 0) * 100)}%
                                    <br />
                                    <Text type="secondary">Часовий горизонт: {failure.timeframe}</Text>
                                    <br />
                                    <Text>{failure.reason}</Text>
                                </Card>
                            ))}
                        </>
                    )}
                </Card>
            ) : (
                <Empty description="Gemini-аналіз недоступний" />
            )}
        </div>
    );
};

export default PredictionResults;