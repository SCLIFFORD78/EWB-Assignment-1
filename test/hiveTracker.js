"use strict";

const axios = require("axios");

class HiveTracker {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async getUsers() {
    try {
      const response = await axios.get(this.baseUrl + "/api/users");
      return response.data;
    } catch (e) {
      return null;
    }
  }

  async getUser(id) {
    try {
      const response = await axios.get(this.baseUrl + "/api/users/" + id);
      return response.data;
    } catch (e) {
      return null;
    }
  }

  async createUser(newUser) {
    try {
      const response = await axios.post(this.baseUrl + "/api/users", newUser);
      return response.data;
    } catch (e) {
      return null;
    }
  }

  async deleteAllUsers() {
    try {
      const response = await axios.delete(this.baseUrl + "/api/users");
      return response.data;
    } catch (e) {
      return null;
    }
  }

  async deleteOneUser(id) {
    try {
      const response = await axios.delete(this.baseUrl + "/api/users/" + id);
      return response.data;
    } catch (e) {
      return null;
    }
  }

  async getHives() {
    try {
      const response = await axios.get(this.baseUrl + "/api/hives");
      return response.data;
    } catch (e) {
      return null;
    }
  }

  async getHive(id) {
    try {
      const response = await axios.get(this.baseUrl + "/api/hives/" + id);
      return response.data;
    } catch (e) {
      return null;
    }
  }

  async createHive(newHive) {
    try {
      const response = await axios.post(this.baseUrl + "/api/hives", newHive);
      return response.data;
    } catch (e) {
      return null;
    }
  }

  async deleteAllHives() {
    try {
      const response = await axios.delete(this.baseUrl + "/api/hives");
      return response.data;
    } catch (e) {
      return null;
    }
  }

  async deleteOneHive(id) {
    try {
      const response = await axios.delete(this.baseUrl + "/api/hives/" + id);
      return response.data;
    } catch (e) {
      return null;
    }
  }

/*   async makeDonation(id, donation) {
    try {
      const response = await axios.post(this.baseUrl + "/api/hives/" + id + "/donations", donation);
      return response.data;
    } catch (e) {
      return null;
    }
  }

  async getDonations(id) {
    try {
      const response = await axios.get(this.baseUrl + "/api/hives/" + id + "/donations");
      return response.data;
    } catch (e) {
      return null;
    }
  }

  async deleteAllDonations() {
    try {
      const response = await axios.delete(this.baseUrl + "/api/donations");
      return response.data;
    } catch (e) {
      return null;
    }
  } */

  async authenticate(user) {
    try {
      const response = await axios.post(this.baseUrl + "/api/users/authenticate", user);
      axios.defaults.headers.common["Authorization"] = "Bearer " + response.data.token;
      return response.data;
    } catch (e) {
      return null;
    }
  }

  async clearAuth(user) {
    axios.defaults.headers.common["Authorization"] = "";
  }
}

module.exports = HiveTracker;
