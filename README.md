**Backend Documentation: Task Management Application**

**Server Live URL**: [https://taskose-indol.vercel.app](https://taskose-indol.vercel.app)  


**Technologies Used**:  
- **Node.js** with **Express.js**  
- **MongoDB** via **Mongoose**  
- **JWT** for authentication  
- **Bcrypt** for password hashing  
- **Validator.js** for input validation  

**Key Features Implemented**:
1. **User Authentication**:  
   - Built RESTful APIs for user registration, login, and logout using JWT authentication.  
   - Secure password storage implemented using Bcrypt hashing.  
   - Added middleware for user session validation and access control, ensuring only admin users can assign tasks.

2. **Task Management**:  
   - Created APIs for creating, updating, deleting, and retrieving tasks with pagination.  
   - Implemented filtering and search options for tasks based on status, priority, and assigned users.

3. **Task Assignment**:  
   - Admins can assign tasks to users through dedicated API endpoints.  
   - Restricted non-admin users to viewing their own tasks and those assigned to them.

4. **Task Summary Report**:  
   - Developed an API to generate a task summary report in JSON or CSV format, with filters for status, user, and date range.

---

