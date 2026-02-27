import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type Organization {
    id: ID!
    name: String!
    organizationType: String!
    cacNumber: String
    primaryContactName: String!
    primaryContactPhone: String!
    primaryContactEmail: String
    address: String!
    lga: String!
    state: String!
    subdomain: String!
    status: String!
    createdAt: String!
    updatedAt: String!
    members: [Member!]
    assets: [Asset!]
  }

  type User {
    id: ID!
    username: String!
    email: String
    role: String!
    organizationId: String!
    organization: Organization!
    lastLogin: String
    isActive: Boolean!
    createdAt: String!
  }

  type Member {
    id: ID!
    memberId: String!
    surname: String!
    firstName: String!
    middleName: String
    dateOfBirth: String
    gender: String
    nin: String!
    phoneNumber: String!
    altPhoneNumber: String
    email: String
    address: String
    lga: String!
    state: String
    nokName: String
    nokPhone: String
    nokRelationship: String
    votoraNumber: String
    operationalLga: String
    membershipStatus: String!
    dateJoined: String!
    roleInSystem: String!
    photoUrl: String
    organizationId: String!
    organization: Organization!
    assets: [Asset!]
    createdAt: String!
    updatedAt: String!
  }

  type Asset {
    id: ID!
    assetId: String!
    karotaNumber: String!
    plateNumber: String
    vehicleType: String!
    color: String
    chassisNumber: String
    engineNumber: String
    acquisitionDate: String
    ownerId: String!
    owner: Member!
    organizationId: String!
    organization: Organization!
    operationalLga: String!
    operationalState: String
    vehicleStatus: String!
    photoUrl: String
    documentUrls: [String!]
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
    requiresOTP: Boolean
  }

  type OTPResponse {
    success: Boolean!
    message: String!
  }

  type PasswordChangeResponse {
    success: Boolean!
    message: String!
  }

  type MemberStats {
    total: Int!
    active: Int!
    suspended: Int!
    inactive: Int!
  }

  type AssetStats {
    total: Int!
    active: Int!
    maintenance: Int!
    retired: Int!
  }

  type DashboardStats {
    members: MemberStats!
    assets: AssetStats!
  }

  type PaginationInfo {
    total: Int!
    totalPages: Int!
    currentPage: Int!
    hasNext: Boolean!
    hasPrevious: Boolean!
  }

  type MemberListResponse {
    data: [Member!]!
    pagination: PaginationInfo!
  }

  type AssetListResponse {
    data: [Asset!]!
    pagination: PaginationInfo!
  }

  input CreateMemberInput {
    surname: String!
    firstName: String!
    middleName: String
    dateOfBirth: String
    gender: String
    nin: String!
    phoneNumber: String!
    altPhoneNumber: String
    email: String
    address: String
    lga: String!
    state: String
    nokName: String
    nokPhone: String
    nokRelationship: String
    votoraNumber: String
    operationalLga: String
    membershipStatus: String
    roleInSystem: String
    photoUrl: String
  }

  input UpdateMemberInput {
    surname: String
    firstName: String
    middleName: String
    dateOfBirth: String
    gender: String
    nin: String
    phoneNumber: String
    altPhoneNumber: String
    email: String
    address: String
    lga: String
    state: String
    nokName: String
    nokPhone: String
    nokRelationship: String
    votoraNumber: String
    operationalLga: String
    membershipStatus: String
    roleInSystem: String
    photoUrl: String
  }

  input CreateAssetInput {
    karotaNumber: String!
    plateNumber: String
    vehicleType: String!
    color: String
    chassisNumber: String
    engineNumber: String
    acquisitionDate: String
    ownerId: String!
    operationalLga: String!
    operationalState: String
    vehicleStatus: String!
    photoUrl: String
    documentUrls: [String!]
  }

  input UpdateAssetInput {
    karotaNumber: String
    plateNumber: String
    vehicleType: String
    color: String
    chassisNumber: String
    engineNumber: String
    acquisitionDate: String
    ownerId: String
    operationalLga: String
    operationalState: String
    vehicleStatus: String
    photoUrl: String
    documentUrls: [String!]
  }

  type Query {
    # Auth
    me: User!

    # Dashboard
    dashboardStats: DashboardStats!

    # Members
    members(page: Int, limit: Int, search: String, status: String): MemberListResponse!
    member(id: ID!): Member
    memberByMemberId(memberId: String!): Member

    # Assets
    assets(page: Int, limit: Int, search: String, status: String): AssetListResponse!
    asset(id: ID!): Asset
    assetByKarotaNumber(karotaNumber: String!): Asset
  }

  type Mutation {
    # Auth
    login(username: String!, password: String!): AuthPayload!
    verifyOTP(username: String!, otp: String!): AuthPayload!

    # Password Management
    requestPasswordReset(phoneNumber: String!): OTPResponse!
    resetPassword(
      phoneNumber: String!
      otp: String!
      newPassword: String!
    ): OTPResponse!
    changePassword(
      currentPassword: String!
      newPassword: String!
    ): PasswordChangeResponse!

    # Members
    createMember(input: CreateMemberInput!): Member!
    updateMember(id: ID!, input: UpdateMemberInput!): Member!
    deleteMember(id: ID!): Boolean!

    # Assets
    createAsset(input: CreateAssetInput!): Asset!
    updateAsset(id: ID!, input: UpdateAssetInput!): Asset!
    deleteAsset(id: ID!): Boolean!
  }
`;
