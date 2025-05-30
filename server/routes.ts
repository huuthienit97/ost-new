import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createMemberSchema, insertMemberSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all departments
  app.get("/api/departments", async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  // Get all members with department info
  app.get("/api/members", async (req, res) => {
    try {
      const { type, department, position, search } = req.query;
      
      let members = await storage.getMembersWithDepartments();
      
      // Apply filters
      if (type && typeof type === 'string') {
        members = members.filter(member => member.memberType === type);
      }
      
      if (department && typeof department === 'string') {
        const deptId = parseInt(department);
        if (!isNaN(deptId)) {
          members = members.filter(member => member.departmentId === deptId);
        }
      }
      
      if (position && typeof position === 'string') {
        members = members.filter(member => member.position === position);
      }
      
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        members = members.filter(member =>
          member.fullName.toLowerCase().includes(searchLower) ||
          member.studentId.toLowerCase().includes(searchLower) ||
          member.class.toLowerCase().includes(searchLower) ||
          member.department.name.toLowerCase().includes(searchLower)
        );
      }
      
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  // Get member by ID
  app.get("/api/members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }
      
      const member = await storage.getMemberWithDepartment(id);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member" });
    }
  });

  // Create new member
  app.post("/api/members", async (req, res) => {
    try {
      const validationResult = createMemberSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.issues 
        });
      }

      const memberData = validationResult.data;
      
      // Check if studentId already exists
      const existingMembers = await storage.getMembers();
      if (existingMembers.some(m => m.studentId === memberData.studentId)) {
        return res.status(400).json({ message: "Mã học sinh đã tồn tại" });
      }
      
      // Validate department exists
      const department = await storage.getDepartment(memberData.departmentId);
      if (!department) {
        return res.status(400).json({ message: "Ban không tồn tại" });
      }

      const newMember = await storage.createMember(memberData);
      const memberWithDepartment = await storage.getMemberWithDepartment(newMember.id);
      
      res.status(201).json(memberWithDepartment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create member" });
    }
  });

  // Update member
  app.put("/api/members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }

      const validationResult = insertMemberSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.issues 
        });
      }

      const updateData = validationResult.data;
      
      // If updating studentId, check for conflicts
      if (updateData.studentId) {
        const existingMembers = await storage.getMembers();
        if (existingMembers.some(m => m.studentId === updateData.studentId && m.id !== id)) {
          return res.status(400).json({ message: "Mã học sinh đã tồn tại" });
        }
      }
      
      // If updating department, validate it exists
      if (updateData.departmentId) {
        const department = await storage.getDepartment(updateData.departmentId);
        if (!department) {
          return res.status(400).json({ message: "Ban không tồn tại" });
        }
      }

      const updatedMember = await storage.updateMember(id, updateData);
      if (!updatedMember) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      const memberWithDepartment = await storage.getMemberWithDepartment(updatedMember.id);
      res.json(memberWithDepartment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update member" });
    }
  });

  // Delete member
  app.delete("/api/members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }

      const deleted = await storage.deleteMember(id);
      if (!deleted) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete member" });
    }
  });

  // Get member statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const allMembers = await storage.getMembers();
      const departments = await storage.getDepartments();
      
      const activeMembers = allMembers.filter(m => m.memberType === 'active').length;
      const alumniMembers = allMembers.filter(m => m.memberType === 'alumni').length;
      
      const stats = {
        totalMembers: allMembers.length,
        activeMembers,
        alumniMembers,
        totalDepartments: departments.length,
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
