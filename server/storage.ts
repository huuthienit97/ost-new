import { 
  members, 
  departments, 
  type Member, 
  type Department, 
  type InsertMember, 
  type InsertDepartment, 
  type MemberWithDepartment 
} from "@shared/schema";

export interface IStorage {
  // Department methods
  getDepartments(): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;

  // Member methods
  getMembers(): Promise<Member[]>;
  getMembersWithDepartments(): Promise<MemberWithDepartment[]>;
  getMember(id: number): Promise<Member | undefined>;
  getMemberWithDepartment(id: number): Promise<MemberWithDepartment | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: number, member: Partial<InsertMember>): Promise<Member | undefined>;
  deleteMember(id: number): Promise<boolean>;
  getMembersByDepartment(departmentId: number): Promise<Member[]>;
  getMembersByType(memberType: string): Promise<Member[]>;
  getMembersByPosition(position: string): Promise<Member[]>;
  searchMembers(query: string): Promise<Member[]>;
}

export class MemStorage implements IStorage {
  private departments: Map<number, Department>;
  private members: Map<number, Member>;
  private departmentIdCounter: number;
  private memberIdCounter: number;

  constructor() {
    this.departments = new Map();
    this.members = new Map();
    this.departmentIdCounter = 1;
    this.memberIdCounter = 1;
    
    // Initialize with default departments
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default departments
    const defaultDepartments = [
      { name: "Ban Thiết Kế", icon: "palette", color: "purple" },
      { name: "Ban Truyền Thông", icon: "bullhorn", color: "pink" },
      { name: "Ban Sự Kiện", icon: "calendar-star", color: "teal" },
      { name: "Ban Kỹ Thuật", icon: "code", color: "blue" },
      { name: "Ban Nhân Sự", icon: "users", color: "green" },
      { name: "Ban Tài Chính", icon: "coins", color: "yellow" },
    ];

    defaultDepartments.forEach(dept => {
      const department: Department = {
        id: this.departmentIdCounter++,
        ...dept,
      };
      this.departments.set(department.id, department);
    });
  }

  // Department methods
  async getDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.get(id);
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const department: Department = {
      id: this.departmentIdCounter++,
      ...insertDepartment,
    };
    this.departments.set(department.id, department);
    return department;
  }

  // Member methods
  async getMembers(): Promise<Member[]> {
    return Array.from(this.members.values());
  }

  async getMembersWithDepartments(): Promise<MemberWithDepartment[]> {
    const allMembers = Array.from(this.members.values());
    return allMembers.map(member => {
      const department = this.departments.get(member.departmentId);
      return {
        ...member,
        department: department!,
      };
    });
  }

  async getMember(id: number): Promise<Member | undefined> {
    return this.members.get(id);
  }

  async getMemberWithDepartment(id: number): Promise<MemberWithDepartment | undefined> {
    const member = this.members.get(id);
    if (!member) return undefined;
    
    const department = this.departments.get(member.departmentId);
    if (!department) return undefined;
    
    return {
      ...member,
      department,
    };
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const member: Member = {
      id: this.memberIdCounter++,
      isActive: true,
      ...insertMember,
    };
    this.members.set(member.id, member);
    return member;
  }

  async updateMember(id: number, updates: Partial<InsertMember>): Promise<Member | undefined> {
    const member = this.members.get(id);
    if (!member) return undefined;
    
    const updatedMember: Member = { ...member, ...updates };
    this.members.set(id, updatedMember);
    return updatedMember;
  }

  async deleteMember(id: number): Promise<boolean> {
    return this.members.delete(id);
  }

  async getMembersByDepartment(departmentId: number): Promise<Member[]> {
    return Array.from(this.members.values()).filter(
      member => member.departmentId === departmentId
    );
  }

  async getMembersByType(memberType: string): Promise<Member[]> {
    return Array.from(this.members.values()).filter(
      member => member.memberType === memberType
    );
  }

  async getMembersByPosition(position: string): Promise<Member[]> {
    return Array.from(this.members.values()).filter(
      member => member.position === position
    );
  }

  async searchMembers(query: string): Promise<Member[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.members.values()).filter(member =>
      member.fullName.toLowerCase().includes(lowercaseQuery) ||
      member.studentId.toLowerCase().includes(lowercaseQuery) ||
      member.class.toLowerCase().includes(lowercaseQuery) ||
      (member.email && member.email.toLowerCase().includes(lowercaseQuery))
    );
  }
}

export const storage = new MemStorage();
