function parsePayload(record) {
    const json = Buffer.from(record.kinesis.data, 'base64').toString('utf8');
    return JSON.parse(json);
};

module.exports.getRecords = (e) => {
    return e.Records.map(parsePayload);
}