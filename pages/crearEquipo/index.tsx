//crearEquipo/index.tsx
"use client";
import * as React from "react";
import { Header } from "../../components/head/Header";
import { DashboardSidebar } from "../../components/sidebar/DashboardSidebar";
import { TeamForm } from "../../components/crearEquipo/TeamForm";

function CreateTeamDesktop() {
  return (
    <div className="overflow-hidden bg-white">
      <Header />
      <div className="w-full max-w-[1384px] max-md:max-w-full">
        <div className="flex gap-5 max-md:flex-col">
          <div className="w-[24%] max-md:ml-0 max-md:w-full">
            <DashboardSidebar />
          </div>
          <div className="ml-5 w-[76%] max-md:ml-0 max-md:w-full">
            <TeamForm />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateTeamDesktop;
