export declare const findUserByEmail: (email: string) => Promise<any>;
export declare const findUserByRole: (role: "klien" | "arsitek") => Promise<any>;
export declare const createUser: (nama: string, email: string, password: string, role: "klien" | "arsitek") => Promise<any>;
export declare const findUserById: (id: number) => Promise<any>;
export declare const updateUserProfile: (id: number, nama: string, email: string, phone: string, alamat: string) => Promise<any>;
export declare const updateUserFoto: (id: number, foto: string) => Promise<any>;
export declare const updateUserPassword: (id: number, password: string) => Promise<any>;
//# sourceMappingURL=userModel.d.ts.map