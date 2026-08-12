import React from "react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl rounded-lg bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">
          Privacy Policy
        </h1>

        <p className="mb-4 text-gray-600">
          Last updated: August 2026
        </p>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            1. Introduction
          </h2>
          <p className="text-gray-700">
            Interndo ("we", "our", or "the application") is an internship
            management platform designed to help students, supervisors, and
            administrators manage internship activities and related reports.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            2. Information We Collect
          </h2>
          <p className="mb-2 text-gray-700">
            Depending on how you use Interndo, we may collect information such
            as:
          </p>

          <ul className="list-disc space-y-1 pl-6 text-gray-700">
            <li>Name and account information</li>
            <li>Email address</li>
            <li>Internship and academic information</li>
            <li>Daily internship logs and reports</li>
            <li>Information submitted through the application</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            3. How We Use Information
          </h2>
          <p className="text-gray-700">
            Information collected through Interndo is used to provide and
            maintain the application's functionality, manage internship
            activities, facilitate communication between relevant users, and
            generate internship-related reports.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            4. Data Security
          </h2>
          <p className="text-gray-700">
            We take reasonable measures to protect information handled by the
            application. However, no online service can guarantee absolute
            security.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            5. Third-Party Services
          </h2>
          <p className="text-gray-700">
            Interndo may rely on third-party services for hosting, data
            storage, authentication, or other infrastructure required to
            operate the application.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            6. Contact
          </h2>
          <p className="text-gray-700">
            If you have questions about this Privacy Policy or the handling of
            your information, please contact the Interndo development team.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            7. Changes to This Policy
          </h2>
          <p className="text-gray-700">
            This Privacy Policy may be updated periodically. Any changes will
            be reflected on this page.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;

