"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WorkerHelper = require("../../common/helper/worker-helper");
const RegistrationConversionProcessor = require("../service/conversions/registration-conversion-processor");
const options = {
    processName: 'conversion-processor',
    durationInSecondsToAlert: 50,
};
async function toExecute() {
    return RegistrationConversionProcessor.process();
}
(async () => {
    await WorkerHelper.process(toExecute, options);
})();
