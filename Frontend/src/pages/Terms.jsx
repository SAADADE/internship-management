import React from "react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl rounded-lg bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">
          Terms of Use
        </h1>

        <p className="mb-4 text-gray-600">
          Last updated: August 2026
        </p>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            1. Acceptance of Terms
          </h2>
          <p className="text-gray-700">
            By accessing or using Interndo, you agree to comply with these
            Terms of Use. If you do not agree with these terms, please do not
            use the application.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            2. Use of the Application
          </h2>
          <p className="text-gray-700">
            Interndo is intended to support the management of internship
            activities, including daily logs, supervision, and report
            generation. Users agree to use the application only for lawful
            purposes and in accordance with applicable institutional policies.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            3. User Responsibilities
          </h2>

          <ul className="list-disc space-y-1 pl-6 text-gray-700">
            <li>
              Users are responsible for providing accurate information.
            </li>
            <li>
              Users should keep their account credentials confidential.
            </li>
            <li>
              Users should not attempt to gain unauthorized access to the
              application or its data.
            </li>
            <li>
              Users should not use the application to submit unlawful,
              malicious, or misleading content.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            4. Generated Reports and Content
          </h2>
          <p className="text-gray-700">
            Users are responsible for reviewing information and reports
            generated through Interndo before submitting or relying on them
            for academic or professional purposes.
            Interndo does not guarantee the accuracy or completeness of generated reports.
            Interndo is not liable for any consequences resulting from the use of generated reports or content.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            5. Availability
          </h2>
          <p className="text-gray-700">
            We aim to keep Interndo available and functional, but we do not
            guarantee uninterrupted or error-free operation of the service.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            6. Changes to the Terms
          </h2>
          <p className="text-gray-700">
            These Terms of Use may be updated periodically. Continued use of
            Interndo after changes are published constitutes acceptance of the
            updated terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            7. Contact
          </h2>
          <p className="text-gray-700">
            If you have questions regarding these Terms of Use, please contact
            the Interndo development team.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;

