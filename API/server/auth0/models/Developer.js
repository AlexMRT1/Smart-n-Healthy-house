class Developer {
    constructor(data) {
        this.domain = data.domain;
        this.appName = data.appName;
        this.requiredData = data.requiredData || [];
        this.createdAt = data.createdAt || new Date();
        this.active = data.active || true;
    }
}

module.exports = Developer;